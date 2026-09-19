import type { Context } from 'hono';
import type {
  AccessTokenClaims,
  CalculateTax,
  DeleteTaxAssessment,
  GetTaxAssessments,
} from '@tax-inspection/shared';
import { taxAssessmentsService } from './tax-assessments.service';

export const taxAssessmentsController = {
  async getAll(c: Context, query: GetTaxAssessments) {
    return c.json(await taxAssessmentsService.list(query));
  },

  async calculate(c: Context, body: CalculateTax) {
    // The assessor is taken from the verified access token.
    const claims = c.get('user') as AccessTokenClaims | undefined;
    if (!claims?.sub) {
      return c.json({ error: 'Unauthenticated' }, 401);
    }
    const assessment = await taxAssessmentsService.calculate(
      body.delivery_id,
      claims.sub,
    );
    return c.json(assessment, 201);
  },

  async remove(c: Context, params: DeleteTaxAssessment) {
    const deleted = await taxAssessmentsService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `Tax assessment ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
