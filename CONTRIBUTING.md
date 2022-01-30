
# Contributing

Code contributions are more than welcome. To get a local dev version of fibermc running:

- Clone the repo
- Navigate to the repo's the root directory
  - `npm install`
  - Run the typescript compiler (`tsc`)
- Navigate to the directory `http2-webserver`
  - `npm install`
  - Generate some ssl keys (for development use only) by running `gen_debug_keys.sh`.
    - There will be prompts for more info. Because this is a dev-only cert, you can leave them all blank. (can just spam
      `Enter`)
  - `npm run dev`
