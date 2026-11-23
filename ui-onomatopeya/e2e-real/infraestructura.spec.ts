import { expect, test } from '@playwright/test';

test('consulta OpenAPI a través del frontend sin simular la API', async ({ request }) => {
  const respuesta = await request.get('/api/v3/api-docs');

  expect(respuesta.ok()).toBe(true);
  expect(respuesta.headers()['content-type']).toContain('application/json');
  expect((await respuesta.json()).openapi).toBeTruthy();
});
