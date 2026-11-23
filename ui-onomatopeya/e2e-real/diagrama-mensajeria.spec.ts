import { expect, test } from '@playwright/test';
import { iniciarSesion, usuariosDemo } from './soporte/sesion';

test('crea y edita una actividad en el diagrama real', async ({ page }) => {
  await iniciarSesion(page, usuariosDemo.administradorUno);
  await page.getByRole('link', { name: 'Solicitud de compra demo' }).click();

  const pool = page.locator('article.pool').filter({ hasText: 'Empresa Demo Uno' });
  await pool.getByRole('button', { name: 'Agregar nodo' }).click();
  const formulario = pool.locator('form.formulario-nodo');
  await formulario.getByLabel('Clase').selectOption('ACTIVIDAD');
  await formulario.getByLabel('Nombre').fill('Actividad E2E');
  await formulario.getByLabel('Posición X').fill('120');
  await formulario.getByLabel('Posición Y').fill('180');
  await formulario.getByLabel('Ancho').fill('120');
  await formulario.getByLabel('Alto').fill('70');
  await formulario.getByLabel('Lane').selectOption({ index: 1 });
  await formulario.getByLabel('Tipo de actividad').selectOption('TAREA');
  await formulario.getByRole('button', { name: 'Crear nodo' }).click();

  const nodo = page.getByRole('button', { name: 'ACTIVIDAD: Actividad E2E' });
  await expect(nodo).toBeVisible();
  await nodo.click();
  await page.getByRole('button', { name: 'Editar nodo' }).click();
  const edicion = pool.locator('form.formulario-nodo');
  await edicion.getByLabel('Nombre').fill('Actividad E2E editada');
  await edicion.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByRole('button', { name: 'ACTIVIDAD: Actividad E2E editada' })).toBeVisible();
});

test('muestra mensajes, campos, usos y correlación guardados', async ({ page }) => {
  await iniciarSesion(page, usuariosDemo.administradorUno);
  await page.getByRole('link', { name: 'Solicitud de compra demo' }).click();

  await expect(page.getByRole('heading', { name: 'Mensajes entre participantes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SolicitudCompraDemo' })).toBeVisible();
  await expect(page.getByText('Correlación: numeroSolicitud').first()).toBeVisible();
  await page.getByRole('button', { name: 'Ver estructura' }).first().click();
  await expect(page.getByRole('heading', { name: /Estructura de/ })).toBeVisible();
  await expect(page.getByText(/numeroSolicitud \(TEXTO\)/)).toBeVisible();
});
