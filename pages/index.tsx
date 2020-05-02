import Link from "next/link";

export default () => {
    return (
        <div>
            <Link href="/tests/webrtc">
                <a>
                    WebRTC Test
                </a>
            </Link>
            <Link href="/tests/soundjack">
                <a>
                    Soundjack Test
                </a>
            </Link>
        </div>
    );
}
