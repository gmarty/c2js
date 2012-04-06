# c2js

c2js is a set of regexps used to speed the porting of C applications to JavaScript.

Simply do:

```
node c2js /full/path/to/c/file
```

And the result will be printed to stdout.

I decided to use regexp replacements instead of parser because that was easier for me.

This was developped for a particular project, so it may not meet your needs.