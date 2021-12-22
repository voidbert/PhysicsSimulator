//A buffer accompanied by its index in the simulation. A web worker will produce many buffers with
//simulation data and those need to be ordered, therefore the index.
class NumberedBuffer {
	index: number;
	buffer: ArrayBuffer;

	constructor(index: number, buffer: ArrayBuffer) {
		this.index = index;
		this.buffer = buffer;
	}
}

//A wrapper for a web worker for physics simulations. Data must be transferred in buffers of frames,
//a frame being composed by data you send every position update.
class WorkerWrapper {
	private worker: Worker;

	private buffers: NumberedBuffer[] = [];
	private bufferLimit: number;

	private frameSize: number;

	//Creates a web worker from a file (url).
	//
	//data is posted as a message when the web worker starts. It shouldn't have a bufferSize or a
	//allowedBuffers property, as that will be set by this constructor.
	//
	//frameSize is the number of bytes in every frame (information transferred per simulator update)
	//
	//callback is called when the webworker posts a message (except "TERMINATE").
	//
	//bufferSize is the number of frames in a buffer, a block of data transmitted between the two
	//contexts (window and web worker).
	//
	//bufferLimit is the number of buffers that this class can store at once before discarding old
	//ones. WorkerWrapper stores buffers provided by the web worker that can be requested later for
	//things like rendering body's positions.
	//
	//For the worker to stop itself, use postMessage("TERMINATE"). Therefore, don't post "TERMINATE"
	//otherwise.
	constructor(url: string, data: any, frameSize: number, callback: (w: Worker, data: any) => any,
		bufferSize: number = 512, bufferLimit: number = 16) {

		this.bufferLimit = bufferLimit;
		this.frameSize = frameSize;

		this.worker = new Worker(url);

		data.bufferSize = Math.max(bufferSize, 1);
		data.allowedBuffers = bufferLimit;
		this.worker.postMessage(data); //Start the worker with the data.

		this.worker.onmessage = (e: MessageEvent) => {
			if (e.data === "TERMINATE") {
				this.worker.terminate();
			}

			callback(this.worker, e.data);
		};
	}

	addBuffer(buffer: NumberedBuffer) {
		if (this.buffers.length >= this.bufferLimit) {
			//Buffer array full. Check if there is space for a new buffer.
			for (let i: number = 0; i < this.buffers.length; ++i) {
				if (this.buffers[i] === null) {
					this.buffers[i] = buffer;
					return;
				}
			}

			//There is no free space.
			throw "There is no free space for this buffer";
		} else {
			this.buffers.push(buffer);
		}	
	}

	clearBuffer(index: number) {
		for (let i: number = 0; i < this.buffers.length; ++i) {
			if (this.buffers[i] && this.buffers[i].index === index) {
				this.buffers[i] = null;
				this.worker.postMessage({ allowedBuffers: 1 });
				return;
			}
		}
	}
}