import { expect, test } from '@playwright/test';

test('inicia y cierra sesión usando la API', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({
    json: { token: 'token-demostracion', tipo: 'Bearer', expiraEn: '2099-01-01T00:00:00Z' }
  }));
  await page.route('**/api/auth/sesion', route => route.fulfill({
    json: { id: 1, empresaId: 1, nombre: 'Sebastián', correo: 'sebastian@onomatopeya.com',
      rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '2026-01-01T00:00:00Z', version: 0 }
  }));
  await page.route('**/api/procesos?**', route => route.fulfill({
    json: { contenido: [], pagina: 0, tamanio: 10, total: 0, paginas: 0 }
  }));

  await page.goto('/login');
  await page.getByLabel('Correo').fill('sebastian@onomatopeya.com');
  await page.getByLabel('Contraseña').fill('Password123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/procesos/);
  await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).first().click();
  await expect(page).toHaveURL(/\/login/);
});

test('impide enviar el formulario de acceso incompleto', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Ingresa el correo.')).toBeVisible();
  await expect(page.getByText('Ingresa la contraseña.')).toBeVisible();
});

test('configura la compartición de un proceso como administrador', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('onomatopeya.sesion', JSON.stringify({
    token: 'token-administrador', tipo: 'Bearer', expiraEn: '2099-01-01T00:00:00Z'
  })));
  await page.route('**/api/auth/sesion', route => route.fulfill({ json: {
    id: 1, empresaId: 1, nombre: 'Sebastián', correo: 'sebastian@onomatopeya.com',
    rolAcceso: 'ADMINISTRADOR', estado: 'ACTIVO', fechaCreacion: '2026-01-01T00:00:00Z', version: 0
  }}));
  await page.route('**/api/procesos/7', route => route.fulfill({ json: {
    id: 7, empresaId: 1, creadorId: 1, nombre: 'Compras', descripcion: null,
    categoria: null, estadoPublicacion: 'BORRADOR', activo: true,
    fechaCreacion: '2026-01-01T00:00:00Z', version: 3
  }}));
  await page.route('**/api/procesos/7/permisos-estructura', async route => {
    if (route.request().method() === 'GET') await route.fulfill({ json: [] });
    else await route.fulfill({ json: { id: 1, procesoId: 7, ...route.request().postDataJSON(), version: 0 } });
  });
  let cuerpoComparticion: unknown;
  await page.route('**/api/procesos/7/comparticion', async route => {
    cuerpoComparticion = route.request().postDataJSON();
    await route.fulfill({ json: { id: 2, procesoId: 7, empresaId: 4, activo: true, version: 0 } });
  });

  await page.goto('/procesos/7/configuracion');
  await page.getByLabel('Identificador de la empresa').fill('4');
  await page.getByRole('button', { name: 'Guardar acceso' }).click();

  await expect(page.getByText('Acceso de consulta habilitado.')).toBeVisible();
  expect(cuerpoComparticion).toEqual({ empresaId: 4, permitido: true, version: 3 });
});

test('muestra mensajería sin controles de edición al usuario de lectura', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('onomatopeya.sesion', JSON.stringify({
    token: 'token-lectura', tipo: 'Bearer', expiraEn: '2099-01-01T00:00:00Z'
  })));
  await page.route('**/api/auth/sesion', route => route.fulfill({ json: {
    id: 2, empresaId: 1, nombre: 'Lector', correo: 'lector@onomatopeya.com',
    rolAcceso: 'LECTURA', estado: 'ACTIVO', fechaCreacion: '2026-01-01T00:00:00Z', version: 0
  }}));
  await page.route('**/api/procesos/7/diagrama', route => route.fulfill({ json: {
    proceso: { id: 7, empresaId: 1, creadorId: 1, nombre: 'Compras', descripcion: null,
      categoria: null, estadoPublicacion: 'BORRADOR', activo: true,
      fechaCreacion: '2026-01-01T00:00:00Z', version: 3 },
    pools: [], lanes: [], nodos: [], arcos: [],
    mensajes: [{ mensaje: { id: 1, nodoId: 10, sentido: 'ENVIO', nombre: 'Pedido',
      origenExterno: false, correlacionTipo: null, correlacionNegocio: null,
      correlacionCampoId: null, politicaSinCorrespondencia: null, activo: true, version: 0 },
      campos: [], usos: [] }], flujos: [], advertencias: []
  }}));

  await page.goto('/procesos/7/diagrama');

  await expect(page.getByText('Pedido', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo mensaje' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retirar' })).toHaveCount(0);
});
