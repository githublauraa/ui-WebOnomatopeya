import { expect, test } from '@playwright/test';
import { cerrarSesion, crearProceso, iniciarSesion, usuariosDemo } from './soporte/sesion';

test('el usuario de lectura consulta sin controles de edición', async ({ page }) => {
  await iniciarSesion(page, usuariosDemo.lectorUno);
  await expect(page.getByRole('link', { name: 'Crear proceso' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Solicitud de compra demo' }).click();

  await expect(page.getByText('Solo consulta: puedes ver el diagrama y sus datos.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar descripción' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Agregar nodo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo mensaje' })).toHaveCount(0);
});

test('el editor modifica procesos pero no recibe acciones administrativas', async ({ page }) => {
  await iniciarSesion(page, usuariosDemo.editorUno);
  await expect(page.getByRole('link', { name: 'Crear proceso' })).toBeVisible();

  const fila = page.locator('.list-group-item').filter({ hasText: 'Solicitud de compra demo' });
  await expect(fila.getByRole('link', { name: 'Editar' })).toBeVisible();
  await expect(fila.getByRole('link', { name: 'Configurar' })).toHaveCount(0);
  await expect(fila.getByRole('button', { name: 'Retirar' })).toHaveCount(0);
});

test('una empresa no puede consultar el proceso privado de otra empresa', async ({ page }) => {
  const nombre = 'Proceso privado empresa uno';
  await iniciarSesion(page, usuariosDemo.administradorUno);
  const ruta = await crearProceso(page, nombre);
  await cerrarSesion(page);

  await iniciarSesion(page, usuariosDemo.administradorDos);
  await expect(page.getByText(nombre)).toHaveCount(0);
  await page.goto(ruta);
  await expect(page.locator('.estado.error')).toBeVisible();
  await expect(page.getByRole('heading', { name: nombre })).toHaveCount(0);
});
