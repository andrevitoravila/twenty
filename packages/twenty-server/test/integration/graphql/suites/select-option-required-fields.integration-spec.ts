import { createOneOperation } from 'test/integration/graphql/utils/create-one-operation.util';
import { destroyOneOperation } from 'test/integration/graphql/utils/destroy-one-operation.util';
import { makeGraphqlApiRequest } from 'test/integration/graphql/utils/make-graphql-api-request.util';
import { updateManyOperationFactory } from 'test/integration/graphql/utils/update-many-operation-factory.util';
import { updateOneOperation } from 'test/integration/graphql/utils/update-one-operation.util';
import { updateOneFieldMetadata } from 'test/integration/metadata/suites/field-metadata/utils/update-one-field-metadata.util';
import { findManyObjectMetadata } from 'test/integration/metadata/suites/object-metadata/utils/find-many-object-metadata.util';
import { jestExpectToBeDefined } from 'test/utils/jest-expect-to-be-defined.util.test';

import { type FieldMetadataDTO } from 'src/engine/metadata-modules/field-metadata/dtos/field-metadata.dto';

const findOpportunityField = (
  fields: FieldMetadataDTO[],
  fieldName: string,
): FieldMetadataDTO => {
  const field = fields.find(({ name }) => name === fieldName);

  jestExpectToBeDefined(field);

  return field;
};

describe('Select option required fields', () => {
  let stageField: FieldMetadataDTO;
  let amountField: FieldMetadataDTO;
  let closeDateField: FieldMetadataDTO;
  let opportunityId: string;

  beforeAll(async () => {
    const { objects } = await findManyObjectMetadata({
      expectToFail: false,
      input: { filter: {}, paging: { first: 100 } },
      gqlFields: `
        id
        nameSingular
        fieldsList {
          id
          name
          type
          settings
        }
      `,
    });

    const opportunityFields = objects.find(
      ({ nameSingular }) => nameSingular === 'opportunity',
    )?.fieldsList;

    jestExpectToBeDefined(opportunityFields);

    stageField = findOpportunityField(opportunityFields, 'stage');
    amountField = findOpportunityField(opportunityFields, 'amount');
    closeDateField = findOpportunityField(opportunityFields, 'closeDate');

    await updateOneFieldMetadata({
      expectToFail: false,
      input: {
        idToUpdate: stageField.id,
        updatePayload: {
          settings: {
            requiredFieldMetadataIdsByOptionValue: {
              PROPOSAL: [amountField.id, closeDateField.id],
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    await updateOneFieldMetadata({
      expectToFail: false,
      input: {
        idToUpdate: stageField.id,
        updatePayload: { settings: stageField.settings ?? null },
      },
    });
  });

  beforeEach(async () => {
    const { data } = await createOneOperation({
      objectMetadataSingularName: 'opportunity',
      input: {
        name: 'Stage gating test',
        stage: 'NEW',
        amount: { amountMicros: null, currencyCode: 'BRL' },
        closeDate: null,
      },
    });

    opportunityId = data.createOneResponse.id;
  });

  afterEach(async () => {
    await destroyOneOperation({
      objectMetadataSingularName: 'opportunity',
      recordId: opportunityId,
    });
  });

  it('rejects moving a record into an option while its required fields are empty', async () => {
    const { errors } = await updateOneOperation({
      objectMetadataSingularName: 'opportunity',
      recordId: opportunityId,
      input: { stage: 'PROPOSAL' },
      gqlFields: 'id stage',
      expectToFail: true,
    });

    expect(errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(errors?.[0]?.message).toContain('amount');
    expect(errors?.[0]?.message).toContain('closeDate');
  });

  it('rejects bulk moves too', async () => {
    const response = await makeGraphqlApiRequest(
      updateManyOperationFactory({
        objectMetadataSingularName: 'opportunity',
        objectMetadataPluralName: 'opportunities',
        gqlFields: 'id',
        filter: { id: { in: [opportunityId] } },
        data: { stage: 'PROPOSAL' },
      }),
    );

    expect(response.body.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
  });

  it('accepts the move when the required fields come with it', async () => {
    const { data, errors } = await updateOneOperation({
      objectMetadataSingularName: 'opportunity',
      recordId: opportunityId,
      input: {
        stage: 'PROPOSAL',
        amount: { amountMicros: 1000000000, currencyCode: 'BRL' },
        closeDate: '2026-12-01T00:00:00.000Z',
      },
      gqlFields: 'id stage',
    });

    expect(errors).toBeUndefined();
    expect(data.updateOneResponse.stage).toBe('PROPOSAL');
  });

  it('leaves updates that do not change the option alone', async () => {
    const { errors } = await updateOneOperation({
      objectMetadataSingularName: 'opportunity',
      recordId: opportunityId,
      input: { name: 'Renamed deal', stage: 'NEW' },
      gqlFields: 'id',
    });

    expect(errors).toBeUndefined();
  });
});
