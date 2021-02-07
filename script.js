const URL = "https://teachablemachine.withgoogle.com/models/Vp6W5spnX/"; // the link to your model provided by Teachable Machine export panel
        let model, webcam, ctx, labelContainer, maxPredictions;
        const canvas = document.getElementById("canvas");
        canvas.style.display="none";
        async function init() {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
    
            // load the model and metadata
            model = await tmPose.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
    
            // Convenience function to setup a webcam
            const size = 500;
            const flip = true; // whether to flip the webcam
            webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
            await webcam.setup(); // request access to the webcam
            await webcam.play();
            window.requestAnimationFrame(loop);
    
            // append/get elements to the DOM
            canvas.style.display="block";
            canvas.width = size; canvas.height = size;
            ctx = canvas.getContext("2d");
            labelContainer = document.getElementById("label-container");
            for (let i = 0; i < maxPredictions; i++) { // and class labels
                labelContainer.appendChild(document.createElement("div"));
            }
        }
    
        async function loop(timestamp) {
            webcam.update(); // update the webcam frame
            await predict();
            window.requestAnimationFrame(loop);
        }
        let handsDownCount=0;
        let handsHalfDownCount=0;
        async function predict() {
            // Prediction #1: run input through posenet
            // estimatePose can take in an image, video or canvas html element
            const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
            // Prediction 2: run input through teachable machine classification model
            const prediction = await model.predict(posenetOutput);
    
            for (let i = 0; i < maxPredictions; i++) {
                const classPrediction =
                    prediction[i].className + ": " + prediction[i].probability.toFixed(2) + ( i>0?(i===1?`(${handsDownCount})`:`(${handsHalfDownCount})`):"");
                labelContainer.childNodes[i].innerHTML = classPrediction;
            }
            
            if(prediction[1].probability.toFixed(2)> 0.70){
                const handsdownMusic = document.querySelector(".handsdown")
                handsdownMusic.play();
                handsDownCount++;
            }
            if(prediction[2].probability.toFixed(2)> 0.70){
                const handshalfraisedMusic = document.querySelector(".handshalfraised")
                handshalfraisedMusic.play();
                handsHalfDownCount++;
            }
    
            // finally draw the poses
            drawPose(pose);
        }
    
        function drawPose(pose) {
            if (webcam.canvas) {
                ctx.drawImage(webcam.canvas, 0, 0);
                // draw the keypoints and skeleton
                if (pose) {
                    const minPartConfidence = 0.5;
                    tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                    tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
                }
            }
        }