#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ goofy [song name]

	Examples
	  $ goofy "shape of you"
	  $ goofy "ed sheeran perfect"
	  $ goofy "bohemian rhapsody queen"

	Press Ctrl + C to exit
`,
	{
		importMeta: import.meta,
	},
);

render(<App initialQuery={cli.input[0]} />);
