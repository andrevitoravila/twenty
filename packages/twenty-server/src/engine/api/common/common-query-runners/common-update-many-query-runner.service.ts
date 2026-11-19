import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { QUERY_MAX_RECORDS } from 'twenty-shared/constants';
import { ObjectRecord } from 'twenty-shared/types';
import {
  getSelectOptionRequiredFieldMetadataIds,
  isDefined,
} from 'twenty-shared/utils';

import { CommonRecordQueryRunnerService } from 'src/engine/api/common/common-query-runners/common-record-query-runner.service';
import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { STANDARD_ERROR_MESSAGE } from 'src/engine/constants/standard-error-message.constant';
import { CommonBaseQueryRunnerContext } from 'src/engine/api/common/types/common-base-query-runner-context.type';
import { type CommonQueryRunResult } from 'src/engine/api/common/types/common-query-result.type';
import { CommonExtendedQueryRunnerContext } from 'src/engine/api/common/types/common-extended-query-runner-context.type';
import {
  CommonExtendedInput,
  CommonInput,
  CommonQueryNames,
  UpdateManyQueryArgs,
} from 'src/engine/api/common/types/common-query-args.type';
import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { buildMutationQueryBuilder } from 'src/engine/api/common/common-query-runners/utils/build-mutation-query-builder.util';
import {
  computeSelectOptionRequiredFieldsUpdateViolations,
  getSelectFieldNamesGatedByUpdateData,
} from 'src/engine/api/common/common-query-runners/utils/compute-select-option-required-fields-update-violations.util';
import { assertIsValidUuid } from 'src/engine/api/graphql/workspace-query-runner/utils/assert-is-valid-uuid.util';
import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/utils/get-flat-fields-for-flat-object-metadata.util';
import { assertMutationNotOnRemoteObject } from 'src/engine/metadata-modules/object-metadata/utils/assert-mutation-not-on-remote-object.util';

@Injectable()
export class CommonUpdateManyQueryRunnerService extends CommonRecordQueryRunnerService<
  UpdateManyQueryArgs,
  ObjectRecord[]
> {
  protected readonly operationName = CommonQueryNames.UPDATE_MANY;

  async run(
    args: CommonExtendedInput<UpdateManyQueryArgs>,
    queryRunnerContext: CommonExtendedQueryRunnerContext,
  ): Promise<CommonQueryRunResult<ObjectRecord[]>> {
    await this.assertSelectOptionRequiredFieldsAreFilled({
      queryRunnerContext,
      filter: args.filter,
      data: args.data,
    });

    return this.runFilteredMutation({
      queryRunnerContext,
      filter: args.filter,
      selection: args.selectedFieldsResult,
      kind: 'update',
      data: args.data,
    });
  }

  private async assertSelectOptionRequiredFieldsAreFilled({
    queryRunnerContext,
    filter,
    data,
  }: {
    queryRunnerContext: CommonExtendedQueryRunnerContext;
    filter: Partial<ObjectRecordFilter>;
    data: Partial<ObjectRecord>;
  }): Promise<void> {
    const { flatObjectMetadata, flatFieldMetadataMaps, commonQueryParser } =
      queryRunnerContext;

    const fieldMetadataItems = getFlatFieldsFromFlatObjectMetadata(
      flatObjectMetadata,
      flatFieldMetadataMaps,
    );

    const gatedSelectFieldNames = getSelectFieldNamesGatedByUpdateData({
      fieldMetadataItems,
      data,
    });

    if (gatedSelectFieldNames.length === 0) {
      return;
    }

    const fieldNameById = new Map(
      fieldMetadataItems.map(({ id, name }) => [id, name]),
    );

    const requiredFieldNames = fieldMetadataItems
      .filter(({ name }) => gatedSelectFieldNames.includes(name))
      .flatMap(({ name, settings }) =>
        getSelectOptionRequiredFieldMetadataIds({
          settings,
          optionValue: data[name] as string,
        }),
      )
      .map((fieldMetadataId) => fieldNameById.get(fieldMetadataId))
      .filter(
        (fieldName): fieldName is string => typeof fieldName === 'string',
      );

    const repository = this.getReadRepository(queryRunnerContext);

    const { selectQueryBuilder } = await buildMutationQueryBuilder({
      repository,
      alias: flatObjectMetadata.nameSingular,
      filter,
      commonQueryParser,
      kind: 'update',
    });

    const recordIds = (
      await selectQueryBuilder
        .select(['id'])
        .take(QUERY_MAX_RECORDS + 1)
        .getMany<ObjectRecord>({ noFormatting: true })
    ).map(({ id }) => id);

    if (recordIds.length === 0) {
      return;
    }

    const recordsBeforeUpdate = repository.formatResult<ObjectRecord[]>(
      await repository.findRecordSnapshotsBypassingPermissions({
        ids: recordIds,
        fieldNames: [
          ...new Set([...gatedSelectFieldNames, ...requiredFieldNames]),
        ],
      }),
    );

    const [firstViolation] = computeSelectOptionRequiredFieldsUpdateViolations({
      fieldMetadataItems,
      recordsBeforeUpdate,
      data,
    });

    if (!isDefined(firstViolation)) {
      return;
    }

    const missingFieldLabels = firstViolation.missingFieldLabels.join(', ');
    const optionValue = firstViolation.optionValue;

    throw new CommonQueryRunnerException(
      `Missing required fields to move record ${firstViolation.recordId} to ${firstViolation.selectFieldName} "${optionValue}": ${firstViolation.missingFieldNames.join(', ')}`,
      CommonQueryRunnerExceptionCode.SELECT_OPTION_REQUIRED_FIELDS_MISSING,
      {
        userFriendlyMessage: msg`Fill in ${missingFieldLabels} before moving to "${optionValue}".`,
      },
    );
  }

  async computeArgs(
    args: CommonInput<UpdateManyQueryArgs>,
    queryRunnerContext: CommonBaseQueryRunnerContext,
  ): Promise<CommonInput<UpdateManyQueryArgs>> {
    const {
      authContext,
      flatObjectMetadata,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
    } = queryRunnerContext;

    return {
      ...args,
      filter: this.filterArgProcessor.process({
        filter: args.filter,
        flatObjectMetadata,
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
      }),
      data: (
        await this.dataArgProcessor.process({
          partialRecordInputs: [args.data],
          authContext,
          flatObjectMetadata,
          flatFieldMetadataMaps,
          flatObjectMetadataMaps,
          shouldBackfillPositionIfUndefined: false,
        })
      )[0],
    };
  }

  async validate(
    args: CommonInput<UpdateManyQueryArgs>,
    queryRunnerContext: CommonBaseQueryRunnerContext,
  ): Promise<void> {
    const { flatObjectMetadata } = queryRunnerContext;

    assertMutationNotOnRemoteObject(flatObjectMetadata);
    if (!args.filter) {
      throw new CommonQueryRunnerException(
        'Filter is required',
        CommonQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
      );
    }

    args.filter.id?.in?.forEach((id: string) => assertIsValidUuid(id));
  }
}
