import useDigitalStage from "../../lib/useDigitalStage";

export default () => {
    const {devices} = useDigitalStage();

    return (
        <div>
            {devices.map(device => (
                <li>
                    {device.name}

                </li>
            ))}

        </div>
    )
}
