# Running your impulse using WebAssembly in Node.js

For more information see the documentation at https://docs.edgeimpulse.com/docs/through-webassembly

To run the impulse open a terminal or command prompt and run:

```
$ node run-impulse.js "-19.8800, -0.6900, 8.2300, -17.6600, -1.1300, 5.9700, ..."
```

(Where you replace `"-19.8800, -0.6900, 8.2300, -17.6600, -1.1300, 5.9700, ..."` with your features, as described above).

To get some hints on how to integrate this into your own application, see `run-impulse.js` and the documentation above.

## Edge Impulse for Linux

If you plan to run your impulse from Node.js you probably want to take a look at Edge Impulse for Linux (https://docs.edgeimpulse.com/docs/edge-impulse-for-linux). It offers full hardware acceleration, bindings to cameras and microphones, and Node.js bindings.
