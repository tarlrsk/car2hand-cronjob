#!/usr/bin/env node

// Job 1: Default monitoring job
import("./index.js")
  .then(({ main }) => {
    process.argv[2] = "default-monitor";
    main();
  })
  .catch(console.error);
