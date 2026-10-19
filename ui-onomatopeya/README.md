# Onomatopeya - interfaz

Esta aplicación Angular consulta la API del proyecto. Para probarla en local se necesita el backend en `http://127.0.0.1:8080` con su base PostgreSQL configurada.

```bash
npm ci
npm start
```

Abrir `http://localhost:4200`. El servidor de desarrollo envía las peticiones `/api` al backend mediante `proxy.conf.json`, así que no hace falta escribir la dirección del servidor en cada servicio.

Después de iniciar sesión se muestra el listado de procesos. Al seleccionar uno se abre su diagrama. La sesión se guarda en la pestaña del navegador y se borra al cerrar sesión o cuando el servidor rechaza el acceso.

Para comprobar los cambios:

```bash
npm test -- --watch=false
npm run build
```
