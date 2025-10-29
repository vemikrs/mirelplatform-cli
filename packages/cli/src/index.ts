#!/usr/bin/env node
import { run, handle } from '@oclif/core';

await run(process.argv.slice(2), import.meta.url).catch(handle);
