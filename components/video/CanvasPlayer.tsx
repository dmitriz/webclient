import React from "react";
import {styled} from "baseui";

interface CanvasElement extends HTMLCanvasElement {
    captureStream(): MediaStream;
}

const Canvas = styled("canvas", {
    width: '100%',
    height: 'auto',
    stroke: 'red',
    fill: 'yellow'
});
const HiddenContainer = styled("div", {
    display: 'none'
});

interface AnimationFrame {
    id: string, // Id from videoTrack
    src: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number
}

interface Props {
    width: number;
    height: number;
    videoTracks: MediaStreamTrack[];
    onStreamAvailable?: (stream: MediaStream) => void
}

interface States {
    animationFrames: AnimationFrame[];
    drawing: boolean;
}

export default class CanvasPlayer extends React.Component<Props, States> {
    canvasRef: React.RefObject<CanvasElement>;
    videoContainerRef: React.RefObject<HTMLDivElement>;
    animationFrameId: any;

    constructor(props) {
        super(props);
        this.state = {
            drawing: false,
            animationFrames: []
        };
        this.canvasRef = React.createRef<CanvasElement>();
        this.videoContainerRef = React.createRef<HTMLDivElement>();
    }

    private getVideoTrack = (id: string): MediaStreamTrack | undefined => {
        return this.props.videoTracks.find((videoTrack: MediaStreamTrack) => videoTrack.id === id);
    };

    private getUniqueTracks = (): MediaStreamTrack[] => {
        const uniqueTracks: MediaStreamTrack[] = [];
        this.props.videoTracks.forEach((videoTrack: MediaStreamTrack) => {
            if (!uniqueTracks.find((contained) => contained.id === videoTrack.id)) {
                uniqueTracks.push(videoTrack);
            }
        });
        console.log(uniqueTracks);
        return uniqueTracks;
    };

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<States>, snapshot?: any): void {
        if (prevProps.videoTracks !== this.props.videoTracks) {
            console.log("Tracks changed");

            const videoTracks: MediaStreamTrack[] = this.getUniqueTracks();

            const numberOfElements = videoTracks.length;
            const numRows = Math.ceil(Math.sqrt(numberOfElements));

            const numColsMax = Math.ceil(numberOfElements / numRows);
            console.log("Rows: " + numRows);
            console.log("Cols: " + numColsMax);

            const elementWidth = Math.round(this.props.width / numColsMax);
            const elementHeight = Math.round(this.props.height / numRows);

            // Get and directly clean up
            const currentAnimationFrames: AnimationFrame[] = this.state.animationFrames.filter((animationFrame: AnimationFrame) => this.getVideoTrack(animationFrame.id) != undefined);
            for (let i = 0; i < numberOfElements; i++) {
                const id: string = videoTracks[i].id;
                // Current row:
                const row = Math.ceil((i + 1) / numColsMax) - 1;
                const col = i % (numColsMax);

                const x = col * elementWidth;
                const y = row * elementHeight;

                let videoElement: HTMLVideoElement | null = document.getElementById("video-" + id) as HTMLVideoElement | null;
                if (!videoElement) {
                    videoElement = document.createElement("video");
                    videoElement.id = "video-" + id;
                    videoElement.style.display = "none";
                    videoElement.srcObject = new MediaStream([videoTracks[i]]);
                    videoElement.play();
                    this.videoContainerRef.current.append(videoElement);
                }
                const animationFrame = currentAnimationFrames.find((animationFrame: AnimationFrame) => animationFrame.id === id);
                if (!animationFrame) {
                    currentAnimationFrames.push({
                        id: id,
                        src: videoElement,
                        x: x,
                        y: y,
                        width: elementWidth,
                        height: elementHeight
                    });
                } else {
                    // Just change the meta data
                    animationFrame.x = x;
                    animationFrame.y = y;
                    animationFrame.width = elementWidth;
                    animationFrame.height = elementHeight;
                }
                console.log("[" + row + "|" + col + "]: " + x + "|" + y);
            }
            console.log(currentAnimationFrames);
            this.setState({
                animationFrames: currentAnimationFrames,
                drawing: currentAnimationFrames.length > 0
            });
        }
        if (prevState.drawing !== this.state.drawing) {
            if (this.state.drawing) {
                this.animationFrameId = window.requestAnimationFrame(this.drawAnimationFrames);

            } else {
                window.cancelAnimationFrame(this.animationFrameId);
            }
        }
    };

    componentDidMount(): void {
        if (this.props.onStreamAvailable) {
            this.props.onStreamAvailable(this.canvasRef.current.captureStream());
        }
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(this.animationFrameId);
    }

    private drawAnimationFrames = () => {
        const context = this.canvasRef.current.getContext("2d");
        console.log(this.state.animationFrames.length);
        context.fillStyle = 'black';
        context.strokeStyle = 'red';
        context.fillRect(0, 0, this.props.width, this.props.height);
        this.state.animationFrames.forEach(
            (animationFrame: AnimationFrame) => {
                context.strokeRect(animationFrame.x, animationFrame.y, animationFrame.width, animationFrame.height);
                context.fillRect(animationFrame.x, animationFrame.y, animationFrame.width, animationFrame.height);
                context.drawImage(animationFrame.src, animationFrame.x, animationFrame.y, animationFrame.width, animationFrame.height);
                context.strokeText(animationFrame.id, animationFrame.x + 30, animationFrame.y + 30);
            }
        );
        this.animationFrameId = window.requestAnimationFrame(this.drawAnimationFrames);
    };

    render() {
        return (
            <>
                <Canvas ref={this.canvasRef} width={this.props.width} height={this.props.height}/>
                <HiddenContainer ref={this.videoContainerRef}/>
            </>
        );
    }
}
