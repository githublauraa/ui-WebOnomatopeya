import { expect, test } from '@playwright/test';
import { claveDemo, crearProceso, iniciarSesion, usuariosDemo } from './soporte/sesion';

test('rechaza una contraseña incorrecta e inicia sesión con la contraseña válida', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(usuariosDemo.administradorUno);
  await page.getByLabel('Contraseña').fill(`${claveDemo()}-incorrecta`);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciales inválidas');

  await page.getByLabel('Contraseña').fill(claveDemo());
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/procesos(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
});

test('crea y edita un proceso persistido en PostgreSQL', async ({ page }) => {
  const nombre = 'Proceso E2E automatizado';
  await iniciarSesion(page, usuariosDemo.administradorUno);
  await crearProceso(page, nombre);

  await page.goto('/procesos');
  const fila = page.locator('.list-group-item').filter({ hasText: nombre });
  await expect(fila).toBeVisible();
  await fila.getByRole('link', { name: 'Editar' }).click();
  await page.getByLabel('Descripción').fill('Descripción actualizada desde Playwright.');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('status')).toContainText(`Proceso actualizado: ${nombre}`);
  await page.getByRole('link', { name: 'Consultar proceso' }).click();
  await expect(page.getByText('Descripción actualizada desde Playwright.')).toBeVisible();
});
