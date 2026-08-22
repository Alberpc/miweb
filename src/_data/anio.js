// El anyo del pie se calcula al compilar, para que no se quede viejo
// en 15 paginas cada 1 de enero.
export default () => new Date().getFullYear();
