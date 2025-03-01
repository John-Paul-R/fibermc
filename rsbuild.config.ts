export default {
    html: {
        template: "./rsbuild.template.html",
    },
    source: {
      entry: {
        resource_loader: './public/ts/resource_loader.ts',
        list_search: './public/ts/list_search.ts',
      },
    },
  };