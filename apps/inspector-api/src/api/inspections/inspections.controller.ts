import type { Context } from 'hono';
import { inspectionsService } from './inspections.service';

/**
 * Controller — one function per method/action. Thin: parse the request,
 * delegate to the service, shape the response.
 */
export const inspectionsController = {
  getAll(c: Context) {
    return c.json(inspectionsService.findAll());
  },

  getById(c: Context) {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ error: 'Missing inspection id' }, 400);
    }

    const inspection = inspectionsService.findById(id);

    if (!inspection) {
      return c.json({ error: `Inspection ${id} not found` }, 404);
    }

    return c.json(inspection);
  },
};
