import styles from "./RecordedVideoMenu.module.css";

const RecordedVideoMenu = ({ videoUrl, handleToggleRecordedVideo, resetRecording, uploadRecording }) => {

    //console.log(videoUrl);

    return (
        <div className={styles.container}>
            <button className={styles.buttonClose} onClick={handleToggleRecordedVideo}>Toggle</button>
            <button className={styles.buttonRecordReset} onClick={resetRecording}>Reset</button>
            <button className={styles.buttonConvert} onClick={uploadRecording}>Convert to 3D Object</button>
            {videoUrl && (
                <div className={styles.videoRecorded}>
                    <video className={styles.video} controls src={videoUrl} />
                    <a href={videoUrl} download="recorded-video.webm">Download Video</a>
                </div>
            )}
        </div>
    );
};

export default RecordedVideoMenu;