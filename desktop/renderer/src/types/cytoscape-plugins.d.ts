// Os plugins de layout do Cytoscape não publicam tipos; registramos como módulos
// genéricos (a API usada é só o registrador: cytoscape.use(plugin)).
declare module 'cytoscape-fcose' {
  const ext: cytoscape.Ext;
  export default ext;
}
declare module 'cytoscape-dagre' {
  const ext: cytoscape.Ext;
  export default ext;
}
