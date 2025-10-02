#!/usr/bin/env node

// Job 3: Additional monitoring job
import("./index.js")
  .then(({ main }) => {
    process.argv[2] = "additional-monitor";
    main();
  })
  .catch(console.error);
