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
