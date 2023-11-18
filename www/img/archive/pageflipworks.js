window.addEventListener('load',function() {

const book = document.querySelector("#book");
const paper0 = document.querySelector("#p0");
const paper1 = document.querySelector("#p1");
const paper2 = document.querySelector("#p2");
const paper3 = document.querySelector("#p3");
const paper4 = document.querySelector("#p4");


// Business Logic
let currentLocation = 1;
let numOfPapers = 4;
let maxLocation = numOfPapers + 1;


window.goNextPage = function() {
    if(currentLocation < maxLocation) {
        switch(currentLocation) {
            case 0:
                paper0.classList.add("flipped");
                paper0.style.zIndex = 0;
                break;
            case 1:
                paper1.classList.add("flipped");
                paper1.style.zIndex = 1;
                break;
            case 2:
                paper2.classList.add("flipped");
                paper2.style.zIndex = 2;
                break;
            case 3:
                paper3.classList.add("flipped");
                paper3.style.zIndex = 3;
                break;
            case 4:
                paper4.classList.add("flipped");
                paper4.style.zIndex = 4;
                break;
            default:
                throw new Error("unkown state");
        }
        currentLocation++;
    }
}

window.goPrevPage = function() {
    if(currentLocation > 1) {
        switch(currentLocation) {
            case 1:
                paper1.classList.remove("flipped");
                paper1.style.zIndex = 4;
                break;
            case 2:
                paper1.classList.remove("flipped");
                paper1.style.zIndex = 3;
                break;
            case 3:
                paper2.classList.remove("flipped");
                paper2.style.zIndex = 2;
                break;
            case 4:
                paper3.classList.remove("flipped");
                paper3.style.zIndex = 1;
                break;
            default:
                throw new Error("unkown state");
        }

        currentLocation--;
    }
}
})
