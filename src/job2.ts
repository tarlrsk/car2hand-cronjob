#!/usr/bin/env node

// Job 2: Secondary monitoring job
import("./index.js")
  .then(({ main }) => {
    process.argv[2] = "secondary-monitor";
    main();
  })
  .catch(console.error);
