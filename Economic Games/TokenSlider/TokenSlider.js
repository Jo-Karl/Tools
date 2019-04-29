var slideInterval;

Qualtrics.SurveyEngine.addOnload(function() {
  if (this.question.runtime.Type != "Slider") { return; }

  //For this code to work the Qualtrics question type needs to be set to "Slider" with the following settings:
  //Choices = 1
  //Labels = 0 or 2 (Sets token pool text)
  //Type = Sliders
  //Grid Lines = 0
  //Min Value = 0
  //Max Value = >0 (Large numbers, 200+?, will likely cause tokens to overflow from the question area)
  //Options: Show Value - ON, Everything else - OFF
  //All other settings should be left at default values


  //Editable
  //===================
  //Token Colours
  let tokenFill = "goldenrod";
  let tokenBorder = "orangered";

  //Token Size
  //Changing these by large amounts might cause issues
  //Defaults: 10, 4, 5, 8, 20, 10
  let tokenWidth = 10;     //Radius of token ellipse (x)
  let tokenHeight = 4;     //Radius of token ellipse (y)
  let tokenGap = 5;        //Space between tokens in a stack (vertical)
  let tokenVSpacing = 8;   //Vertical space between stack rows
  let tokenHSpacing = 20;  //Horizontal space between stacks in the same row
                           //Should be greater than tokenWidth
  let tokenPileSize = 10;  //Number of tokens in a stack

  //Initial Slider value
  let startValue = -1;      //If set to -1, this will be set to half of the maximum value

  //Token Pool Labels - Can also be set using Qualtrics Labels (The first 2)
  let defaultLabelTextLeft = "Your Tokens";  //Will be overridden by qualtrics labels if they exist
  let defaultLabelTextRight = "Token Pool";  //As above
  //===================



  //
  //** Edit below this point at your own risk **
  //
  let closure = this.question;
  let sliderWidth = "60%";
  let sliderLeft = "20%";
  let sliderMax = this.question.runtime.CSSliderMax;
  if (startValue == -1) { startValue = Math.floor(sliderMax/2); }
  let doc = this.questionContainer;
  doc.style.marginBottom = "40px";
  let titleHeight = parseFloat(doc.offsetTop) + parseFloat(doc.querySelector(".QuestionText").offsetHeight) - 15 + "px";

  //Get labels for token pools
  let labels = doc.querySelectorAll(".LabelDescriptions table.LabelDescriptions .LightText");
  let leftLabelText;
  let rightLabelText;
  if (labels && labels[0] && labels[1]) {
    leftLabelText = labels[0].innerText;
    labels[0].style.display = "none";
    rightLabelText = labels[1].innerText;
    labels[1].style.display = "none";
  } else {
    leftLabelText = defaultLabelTextLeft;
    rightLabelText = defaultLabelTextRight;
  }

  //Triangle stack layout
  let triangles = [];
  for (let i = 2; i < 20; i++) {
    let min = ((i-1) * (i)) / 2;
    let max = ((i)* (i+1)) / 2;
    for (j = min; j < max; j++) {
      triangles[j+1] = i;
    }
  }
  let maxPiles = triangles[Math.ceil(sliderMax / tokenPileSize)] || 1;
  let maxWidth = 2 + (maxPiles-1) * tokenHSpacing;
  console.log("Max Width: " + maxWidth);
  let maxHeight = tokenHeight * tokenPileSize + (tokenHeight-1) * tokenGap;

  //Set slider value
  closure.runtime.Choices[1].Value = "" + startValue;

  //Resize slider body to make room for images
  let qBody = doc.querySelector(".QuestionBody");
  qBody.style.width = sliderWidth;
  qBody.style.left = sliderLeft;
  //

  //Create svg to render tokens
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  let g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.style.float = "left";
  svg.style.width = doc.offsetWidth + "px";
  svg.style.height = doc.offsetHeight + "px";
  svg.style.position = "absolute";
  svg.style.transform = "translateY(-50%)";
  svg.style.zIndex = "-50";
  qBody.parentNode.appendChild(svg);
  //

  let tokensCreated = false;


  //Overwrite slider layout
  let slider;
  let sliderTable = doc.querySelector("tbody > tr.First");
  for (i in sliderTable.children) {
    let child = sliderTable.children[i];
    if (!child.classList || !child.classList.contains("BarOuter")) {
      if (child.style) {
        child.style.display = "none";
      }
    } else {
      child.setAttribute("colspan", 4);
      child.querySelector(".track").style.minWidth = "100%";
      slider = child;
    }
  }

  //Token positions
  let leftX = 25;
  let leftY = maxHeight + 20;
  let rightX = svg.parentNode.offsetWidth - maxWidth - 25;
  let rightY = leftY;

  //Set interval function to check slide position
  let lastSlide = 0;
  slideInterval = window.setInterval(function() {
    let slidePos = Math.round(getSliderPos() * sliderMax);
    if (slidePos != lastSlide) {
      lastSlide = slidePos;
      updateTokens(leftX, leftY, rightX, rightY);
    }
  },20);

  function getSliderPos() {
    return closure._sliders[1].value;
  }

  //Add Labels - Left tokens, Right Tokens
  let div1 = document.createElement("div");
  div1.style.left = tokenWidth * 1.5 + "px";
  div1.style.position = "absolute";
  div1.style.top = titleHeight;
  div1.style.textAlign = "left";
  div1.innerText = leftLabelText;
  qBody.parentNode.appendChild(div1);
  let div2 = document.createElement("div");
  div2.style.right = tokenWidth * 1.5 + "px";
  div2.style.position = "absolute";
  div2.style.top = titleHeight;
  div2.innerText = rightLabelText;
  div2.style.textAlign = "right";
  qBody.parentNode.appendChild(div2);

  //Slider value label
  let div3 = document.createElement("div");
  div3.style.left = "50%";
  div3.style.transform = "translateX(-50%";
  // div3.style.bottom = "25%";
  div3.style.textAlign = "center";
  div3.style.width = "100px";
  div3.style.fontSize = "20px";
  div3.style.position = "absolute";
  qBody.parentNode.appendChild(div3);

  //Create window resize listener to keep tokens and slider aligned
  window.addEventListener("resize", resizeFunc);
  resizeFunc();

  //Create tokens
  updateTokens(leftX, leftY, rightX, rightY);


  //-- Functions --

  function resizeFunc() {
    let width = parseFloat(sliderTable.offsetWidth);
    slider.querySelector(".track").style.minWidth = width + "px";

    let x1 = 25;
    let y1 = maxHeight + 20;
    let x2 = svg.parentNode.offsetWidth - maxWidth - 25;
    let y2 = y1;

    moveTokens(x1 - leftX, y1 - leftY, x2 - rightX, y2 - rightY);

    svg.style.width = doc.offsetWidth + "px";
    svg.style.height = doc.offsetHeight + "px";

    let titleHeight = parseFloat(doc.offsetTop) + parseFloat(doc.querySelector(".QuestionText").offsetHeight) - 15 + "px";
    div1.style.top = titleHeight;
    div2.style.top = titleHeight;
  }

  function updateTokens(x1, y1, x2, y2) {
    //Redraw tokens
    let sliderPos = getSliderPos();

    removeAllTokens(g1);
    removeAllTokens(g2);

    let tokenCountText = 0;

    if (!tokensCreated) {
      //Create tokens
      let piles = Math.floor(sliderMax / tokenPileSize);
      let remainder = sliderMax - piles * tokenPileSize;
      createTokens(g1, x1, y1, piles, remainder, false);
      svg.appendChild(g1);
      createTokens(g2, x2, y2, piles, remainder, true);
      svg.appendChild(g2);
      tokensCreated = true;
    } else {
      //Update tokens
      //Left Pool
      let tokenCount = Math.round(sliderPos * sliderMax);
      tokenCountText = tokenCount;
      for (let i = 0; i < tokenCount; i++) {
        g1.children[i].style.display = "block";
      }

      //Right Pool
      tokenCount = sliderMax - tokenCount;
      for (let i = 0; i < tokenCount; i++) {
        g2.children[i].style.display = "block";
      }
    }

    //Update counter label
    div3.innerText = tokenCountText;
  }

  function moveTokens(x1, y1, x2, y2) {
    //Adjust position of tokens
    g1.setAttribute("transform", "translate(" + x1 + "," + y1 + ")");
    g2.setAttribute("transform", "translate(" + x2 + "," + y2 + ")");

    for (let i = 0; i < svg.children.length; i++) {
      if (i < sliderMax) {
        svg.children[i].setAttribute("cx", parseFloat(svg.children[i].getAttribute("cx")) + x1);
        svg.children[i].setAttribute("cy", parseFloat(svg.children[i].getAttribute("cy")) + y1);
      } else {
        svg.children[i].setAttribute("cx", parseFloat(svg.children[i].getAttribute("cx")) + x2);
        svg.children[i].setAttribute("cy", parseFloat(svg.children[i].getAttribute("cy")) + y2);
      }
    }
  }

  function createTokens(svg, x1, y1, piles, remainder, alt) {
    let xMod = 0;
    let yMod = 0;
    let triangle = findTriangle(piles + (remainder == 0 ? 0 : 1));
    let triCounter = 0;
    let vCounter = 0;
    for (let i = 0; i <= piles; i++) {
      for (let t = 0; t < tokenPileSize && (i < piles || t < remainder); t++) {
        createToken(svg, x1 + xMod, y1 + yMod - tokenGap * t);
      }

      triCounter++;
      if (triCounter == triangle) {
        triangle--;
        triCounter = 0;
        vCounter++;
        yMod += tokenVSpacing;
        xMod = 0 + vCounter * tokenHSpacing * .5;
      } else {
        xMod += tokenHSpacing;
      }
    }
  }

  function findTriangle(i) {
    if (i <= 2) { return i; }
    return triangles[i] || 1;
  }

  function createToken(svg, x, y) {
    let e1 = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    e1.setAttribute("cx", x);
    e1.setAttribute("cy", y);
    e1.setAttribute("rx", tokenWidth);
    e1.setAttribute("ry", tokenHeight);
    e1.style.fill = tokenFill;
    e1.style.stroke = tokenBorder;
    svg.appendChild(e1);
  }

  function removeAllTokens(svg) {
    //Remove (hide) tokens
    for (i in svg.children) {
      if (svg.children[i].style) {
        svg.children[i].style.display = "none";
      }
    }
  }
});

Qualtrics.SurveyEngine.addOnUnload(function() {
	window.clearInterval(slideInterval);
});