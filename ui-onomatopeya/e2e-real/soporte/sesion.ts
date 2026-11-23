import { expect, Page } from '@playwright/test';

export const usuariosDemo = {
  administradorUno: 'admin.uno@example.com',
  administradorDos: 'admin.dos@example.com',
  editorUno: 'editor.uno@example.com',
  lectorUno: 'lector.uno@example.com'
};

export function claveDemo(): string {
  const clave = process.env['E2E_DEMO_PASSWORD'];
  if (!clave) throw new Error('Falta E2E_DEMO_PASSWORD para ejecutar las pruebas reales.');
  return clave;
}

export async function iniciarSesion(page: Page, correo: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña').fill(claveDemo());
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/procesos(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
}

export async function cerrarSesion(page: Page): Promise<void> {
  await page.goto('/procesos');
  await page.getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function crearProceso(page: Page, nombre: string): Promise<string> {
  await page.goto('/procesos/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Descripción').fill('Proceso creado por la prueba E2E real.');
  await page.getByLabel('Categoría').fill('Pruebas');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toContainText(`Proceso creado: ${nombre}`);
  const enlace = page.getByRole('link', { name: 'Consultar proceso' });
  const ruta = await enlace.getAttribute('href');
  if (!ruta) throw new Error('La API no devolvió el identificador del proceso creado.');
  return ruta;
}
