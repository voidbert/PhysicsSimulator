//A buffer accompanied by its index in the simulation. A web worker will produce many buffers with
//simulation data and those need to be ordered, therefore the index.
class NumberedBuffer {
	index: number;
	size: number; //Number of bytes in the buffer (the buffer may not be full)
	buffer: ArrayBuffer;

	constructor(index: number, size: number, buffer: ArrayBuffer) {
		this.index = index;
		this.size = size;
		this.buffer = buffer;
	}
}

//A wrapper for a web worker for physics simulations. Data must be transferred in buffers of frames,
//a frame being composed by data you send every position update.
class WorkerWrapper {
	private worker: Worker;

	private bufferSize: number;
	private buffers: NumberedBuffer[] = [];
	private bufferLimit: number;

	private frameSize: number
	private simulationQuality: SimulationQuality;

	//Creates a web worker from a file (url).
	//
	//data is posted as a message when the web worker starts. It shouldn't have a bufferSize,
	//simulationQuality or an allowedBuffers property, as those will be set by this constructor.
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
	constructor(url: string, data: any, frameSize: number, simulationQuality: SimulationQuality,
		callback: (w: Worker, data: any) => any, bufferSize: number = 512,
		bufferLimit: number = 16) {

		this.bufferSize = bufferSize;
		this.bufferLimit = bufferLimit;
		this.frameSize = frameSize;
		this.simulationQuality = simulationQuality;

		this.worker = new Worker(url);

		data.bufferSize = Math.max(bufferSize, 1);
		data.allowedBuffers = bufferLimit;
		data.simulationQuality = simulationQuality;
		this.worker.postMessage(data); //Start the worker with the data.

		this.worker.onmessage = (e: MessageEvent) => {
			if (e.data === "TERMINATE") {
				this.worker.terminate();
			}

			callback(this.worker, e.data);
		};
	}

	//This method adds a buffer to the list. If there is no free space, an error will be thrown.
	//Don't repeat buffer indices as that will cause problems.
	addBuffer(buffer: NumberedBuffer): void {
		if (this.buffers.length >= this.bufferLimit) {
			//Buffer array full. Check if there is space for a new buffer.
			for (let i: number = 0; i < this.buffers.length; ++i) {
				if (this.buffers[i] === null) {
					this.buffers[i] = buffer;
					return;
				}
			}

			//There is no free space.
			throw new Error("There is no free space for this buffer");
		} else {
			this.buffers.push(buffer);
		}
	}

	//Removes a buffer from the list. index is the index in the NumberedBuffer and not in the array.
	clearBuffer(index: number): void {
		for (let i: number = 0; i < this.buffers.length; ++i) {
			if (this.buffers[i] && this.buffers[i].index === index) {
				this.buffers[i] = null;
				this.worker.postMessage({ allowedBuffers: 1 });
				return;
			}
		}
	}

	//Provided a time since launch, this method will return two frames from the worker, one the last
	//before the timestamp and the other the first after the timestamp. With these frames, you can
	//implement linear interpolation to know any needed physics parameters. time should be provided
	//in milliseconds and if there are no frames available, an empty array will be returned.
	//autoClear deletes old buffers automatically
	getBoundaryBuffers(time: number, autoClear: boolean = false): ArrayBuffer[] {
		//Find the frames and the buffers where the data for the time is.
		let frameNumber0: number = Math.floor(time / this.simulationQuality);
		let frameNumber1: number = Math.ceil(time / this.simulationQuality);

		let bufferNumber0: number = Math.floor(frameNumber0 / this.bufferSize);
		let bufferNumber1: number = Math.floor(frameNumber1 / this.bufferSize);

		//Find the buffers in the stored array
		let buffer0: NumberedBuffer = null;
		let buffer1: NumberedBuffer = null;
		for (let i: number = 0; i < this.buffers.length; ++i) {
			if (this.buffers[i] && this.buffers[i].index === bufferNumber0) {
				buffer0 = this.buffers[i];
			}
			if (this.buffers[i] && this.buffers[i].index === bufferNumber1) {
				buffer1 = this.buffers[i];
			}
		}
		//If one of the buffers wasn't found, return []
		if (buffer0 === null || buffer1 === null) {
			return [];
		}

		//Remove all buffers with indices lower than the one on buffer0
		if (autoClear) {
			let clearCount = 0;
			for (let i: number = 0; i < this.buffers.length; i++) {
				if (this.buffers[i] && this.buffers[i].index < buffer0.index) {
					this.buffers[i] = null;
					clearCount++;
				}
			}
			if (clearCount !== 0)
				this.worker.postMessage({ allowedBuffers: clearCount });
		}

		//Set the index of the frame inside the buffer
		frameNumber0 -= bufferNumber0 * this.bufferSize;
		frameNumber1 -= bufferNumber1 * this.bufferSize;

		//Frame out of buffer bounds check
		if (frameNumber0 * this.frameSize > buffer0.size ||
			frameNumber1 * this.frameSize > buffer1.size) {

			return [];
		}

		//Copy the frames to array buffers to be returned
		let view0 = new Uint8Array(buffer0.buffer);
		let view1 = new Uint8Array(buffer1.buffer);

		let frame0 = new Uint8Array(this.frameSize);
		let frame1 = new Uint8Array(this.frameSize);
		
		for (let i: number = 0; i < this.frameSize; ++i) {
			frame0[i] = view0[frameNumber0 * this.frameSize + i];
			frame1[i] = view1[frameNumber1 * this.frameSize + i];
		}

		return [ frame0.buffer, frame1.buffer ];
	}
}