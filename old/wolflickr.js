
function WolfenFlickr() {


var $ = function(id) { return document.getElementById(id); };
var dc = function(tag) { return document.createElement(tag); };

var fDegRad = Math.PI / 180;
var fTwoPI = Math.PI * 2;

var iScreenWidth = 320;
var iScreenHeight = 200;
var iLineWidth = 3;
var fFOV = 60 * fDegRad;

var bTexturedWalls = true;

var bRenderMap = !!($("topmap").getContext && $("topmap").getContext("2d"));
var bRenderPlayerOnMap = true;

var bHighResFlickr = false;

var oPlayer = {
	x : 34.51 * 64,
	y : 56.5 * 64,
	speed : 0,
	speedinc : 0,
	rotation : fTwoPI * -0.25,
	rotincdir : 0,
	rotinc : 0,
	cpu : false,
	lastmovetime : 0
}


var iNumWallTextures = 7;

var aWallTexCnv = [];


var aWalls;

var fHalfFOV = fFOV/2;
var fColWidth = fFOV / iScreenWidth;

var fViewDist = (iScreenWidth/2) / Math.tan((fFOV / 2));

var fWallHeight = (64 * fViewDist);

var iLevelWidth = 64;
var iLevelHeight = 64;

var oCtr = $("container");
var oTopMap = $("topmap");
var oTopMapPlayer = $("topmapplayer");

var aLines = [];

var fTopMapScale = 1;

function initScreen() {
	if (aLines.length) {
		for (var i=0;i<aLines.length;i++) {
			if (aLines[i]) {
				oCtr.removeChild(aLines[i]);
			}
		}
		aLines = [];
	}
	for (var i=0;i<iScreenWidth;i+=iLineWidth) {
		var oLine = dc("div");
		oLine.style.position = "absolute";
		oLine.style.left = i + "px";
		oLine.style.width = iLineWidth+"px";
		oLine.style.height = "0px";
		oLine.style.overflow = "hidden";

		oLine.style.backgroundColor = "black";

		var oImg = new Image();
		oImg.src = (window.opera ? "walls_19color.png" : "walls.png");
		oImg.style.position = "absolute";
		oImg.style.left = "0px";
		oImg.style.border = "none";
		oImg.style.padding = "0px";
		oImg.style.margin = "0px";
		oLine.appendChild(oImg);
		oLine.img = oImg;
	
		oLine.linedesc = {};
	
		aLines[i] = oLine;
		oLine.flickr = [];
		oCtr.appendChild(oLine);

	}


}

function loadLevel(strLevel) {
	aWalls = [];
	aEnemies = [];
	aSprites = [];

	XHR("levels/" + strLevel + ".jswolf", 
		function(oHTTP) {
			oLevel = eval("("+oHTTP.responseText+")");
			prepLevel();
			setDescText("Level loaded, drawing map...");
			setTimeout(onLevelLoaded, 10);
		}
	);
}

function prepLevel() {
	aWalls = oLevel.walls;
	aSprites = oLevel.sprites;
	prepSprites();
}

var aSpriteTextures = [];
aSpriteTextures[1] = "sprites/food.png";
aSpriteTextures[2] = "sprites/lamp.png";
//aSpriteTextures[3] = "sprites/ammo.png";
//aSpriteTextures[4] = "sprites/bones.png";
//aSpriteTextures[5] = "sprites/skeleton.png";
aSpriteTextures[6] = "sprites/chandelier.png";
aSpriteTextures[7] = "sprites/plantbrown.png";
aSpriteTextures[8] = "sprites/armor.png";
aSpriteTextures[9] = "sprites/vase.png";
//aSpriteTextures[10] = "sprites/tablechairs.png";
//aSpriteTextures[11] = "sprites/goldcup.png";
//aSpriteTextures[12] = "sprites/goldcross.png";
//aSpriteTextures[13] = "sprites/medikit.png";
//aSpriteTextures[14] = "sprites/greenbarrel.png";
//aSpriteTextures[15] = "sprites/brownbarrel.png";
aSpriteTextures[16] = "sprites/lampstand.png";
aSpriteTextures[17] = "sprites/plantgreen.png";
//aSpriteTextures[18] = "sprites/goldchest.png";
//aSpriteTextures[19] = "sprites/flag.png";
//aSpriteTextures[20] = "sprites/water.png";
//aSpriteTextures[21] = "sprites/well.png";
//aSpriteTextures[22] = "sprites/table.png";
//aSpriteTextures[23] = "sprites/bowl.png";
//aSpriteTextures[24] = "sprites/deadguard.png";


var aSpriteImg = [];

function prepSprites() {
	for (var y=0;y<iLevelHeight;y++) {
		aSpriteImg[y] = [];
		for (var x=0;x<iLevelWidth;x++) {
			if (aSprites[y][x]) {
				var iIdx = aSprites[y][x];
				var oImg = new Image();
				oImg.src = aSpriteTextures[iIdx];
				oImg.style.position = "absolute";
				oImg.style.display = "none";
				oImg.style.left = oImg.style.top = "0px";
				oImg.style.border = "none";
				oImg.style.padding = "0px";
				oImg.style.margin = "0px";

				oImg.posx = x * 64 + 32;
				oImg.posy = y * 64 + 32;
				aSpriteImg[y][x] = oImg;
				oCtr.appendChild(oImg);
			}
		}
	}
}

var iMoveTimer = 1000 / 30;
var bRunning = false;


var iIntervalLogic;
var iIntervalRender;

function startGame() {
	bRunning = true;
	oPlayer.lastmovetime = new Date().getTime();

	if (!iIntervalLogic)
		iIntervalLogic = setInterval(logic,1000/30);
	if (!iIntervalRender)
		iIntervalRender = setInterval(render,1000/20);

	$("flickrusernamebtn").disabled = false;
	$("flickrsearchbtn").disabled = false;

	$("getpsyched").style.display = "none";
}

function logic() {
	if (!bRunning) return false;

	move(oPlayer);
}

var aVisibleSprites = [];

var oLookingAtImg;

var oMapPlayerCtx = oTopMapPlayer.getContext("2d");

function render() {
	if (!bRunning) return false;

	if (bRenderMap && bRenderPlayerOnMap) {
		//oTopMapPlayer.width = oTopMapPlayer.width;
		oMapPlayerCtx.clearRect(0,0,64 * fTopMapScale,64 * fTopMapScale);

		oMapPlayerCtx.strokeStyle = "red";
	
		var fViewRightX = (12*64) * Math.cos(fFOV/2) + oPlayer.x;
		var fViewRightY = (12*64) * Math.sin(fFOV/2) + oPlayer.y;
		var fViewLeftX = (12*64) * Math.cos(-fFOV/2) + oPlayer.x;
		var fViewLeftY = (12*64) * Math.sin(-fFOV/2) + oPlayer.y;

		oMapPlayerCtx.beginPath();
		oMapPlayerCtx.arc(oPlayer.x / 64 * fTopMapScale, oPlayer.y / 64 * fTopMapScale, fTopMapScale/2, 0, Math.PI * 2, true);
		oMapPlayerCtx.closePath();
		oMapPlayerCtx.fillStyle = "red";
		oMapPlayerCtx.fill();

		oMapPlayerCtx.save();

		oMapPlayerCtx.fillStyle = "rgba(255,0,0,0.2)";
	
		oMapPlayerCtx.translate(oPlayer.x / 64 * fTopMapScale, oPlayer.y / 64 * fTopMapScale);
		oMapPlayerCtx.rotate(oPlayer.rotation);
		oMapPlayerCtx.translate(-oPlayer.x / 64 * fTopMapScale, -oPlayer.y / 64 * fTopMapScale);
	
		oMapPlayerCtx.beginPath();
		oMapPlayerCtx.moveTo(fViewRightX/64 * fTopMapScale, fViewRightY/64 * fTopMapScale);
		oMapPlayerCtx.lineTo(oPlayer.x/64 * fTopMapScale,oPlayer.y/64 * fTopMapScale);
		oMapPlayerCtx.lineTo(fViewLeftX/64 * fTopMapScale, fViewLeftY/64 * fTopMapScale);
		oMapPlayerCtx.fill();
		oMapPlayerCtx.stroke();
	
		oMapPlayerCtx.restore();
	}

	oLookingAtImg = null;
	setDescText("");

	// clear all visible sprites
	for (var i=0;i<aVisibleSprites.length;i++) {
		var oImg = aVisibleSprites[i];
		oImg.visible = false;
		oImg.style.display = "none";
	}
	aVisibleSprites = [];

	for (var i=0;i<iScreenWidth;i+=iLineWidth) {
		renderLine(i);
	}


	// in the renderLine() method, all sprites that are encountered in the raycasting runs are put in aVisibleSprites
	// since the horizontal and vertical runs are independent of each other, we also get some sprites that are not actually visible
	// but are hidden behind walls. But at least we're not rendering all sprites.
	for (var i=0;i<aVisibleSprites.length;i++) {
		var oImg = aVisibleSprites[i];
		oImg.style.display = "block";

		// translate position to viewer space
		var fDX = oImg.posx - oPlayer.x;
		var fDY = oImg.posy - oPlayer.y;

		// distance to sprite
		var fDist = Math.sqrt(fDX*fDX + fDY*fDY);

		// size of the sprite
		var iSize = (64 * fViewDist) / fDist;

		// sprite angle relative to viewing angle
		var fSpriteAngle = Math.atan2(fDY, fDX) - oPlayer.rotation;

		// x-position on screen
		var x = Math.sin(fSpriteAngle) * fViewDist / Math.sin(0.5*Math.PI-fSpriteAngle);
		oImg.style.left = (iScreenWidth/2 + x - iSize/2) + "px";

		// y is constant since we keep all sprites at the same height and vertical position
		oImg.style.top = (100-iSize/2)+"px";

		oImg.style.zIndex = 100000000 - Math.floor(fDist);
		oImg.style.width = oImg.style.height = iSize + "px";
	}

	if (oLookingAtImg) {
		setDescText("\"" + oLookingAtImg.title + "\" by " + oLookingAtImg.owner);
	}	
}


var aWallTextures = [];

aWallTextures[1] = 0;
//aWallTextures[2] = 1;
aWallTextures[3] = 1;
aWallTextures[10] = 2;
aWallTextures[12] = 3;
//aWallTextures[13] = 5;
aWallTextures[14] = 4;
aWallTextures[20] = 5;
aWallTextures[21] = 6;
//aWallTextures[22] = 9;


function renderLine(i) {
	var x = oPlayer.x;
	var y = oPlayer.y;

	var fLineAngle = (oPlayer.rotation - fFOV/2) + i*fColWidth;
	while (fLineAngle < 0) fLineAngle += fTwoPI;
	while (fLineAngle >= fTwoPI) fLineAngle -= fTwoPI;


	// cast a ray from the player's origin

	// this part needs a bit of reworking and optimizing
	// currently we're doing two runs, first to check against the horizontal map/map lines
	// next to check against the vertical lines. If a map block was found in both runs, the 
	// the closest one is used. It works for now, but there should only be one ray per line.

	// moving right/left? up/down?
	var bRight = (fLineAngle > fTwoPI * 0.75 || fLineAngle < fTwoPI * 0.25);
	var bUp = (fLineAngle < 0 || fLineAngle > Math.PI);

	var fAngleSin = Math.sin(fLineAngle);
	var fAngleCos = Math.cos(fLineAngle);

	// first check against the horizontal map/wall lines
	var bFoundHor = false;
	var fSlope = fAngleSin / fAngleCos;
	var fDX = 64 * (bRight ? 1 : -1);
	var fDY = fDX * fSlope;
	var fXHor;
	var fYHor;
	var x = bRight ? Math.ceil(oPlayer.x/64)*64 : Math.floor(oPlayer.x/64)*64;
	var y = oPlayer.y + (x - oPlayer.x) * fSlope;
	var bHitBlock = false;

	var fTextureXHor;
	var iTextureIdxHor;

	var iWallXHor = -1;
	var iWallYHor = -1;

	var iLevelMaxX = iLevelWidth*64;
	var iLevelMaxY = iLevelHeight*64;

	while (x >= 0 && x < iLevelWidth*64 && y >= 0 && y < iLevelHeight*64) {

		var iWallX = Math.floor((x + (bRight ? 0 : -1)) / 64);
		var iWallY = Math.floor(y / 64);

		if (iWallX >= 0) {

			if (aSpriteImg[iWallY][iWallX] && !aSpriteImg[iWallY][iWallX].visible) {
				aSpriteImg[iWallY][iWallX].visible = true;
				aVisibleSprites.push(aSpriteImg[iWallY][iWallX]);
			}

			if (aWalls[iWallY][iWallX] > 0) {
				// ok, point is in a wall block
	
				bFoundHor = true;
				fXHor = x;
				fYHor = y;
	
				var fDistX = fXHor - oPlayer.x;
				var fDistY = fYHor - oPlayer.y;
				fHorDist = fDistX*fDistX + fDistY*fDistY;

				fTextureXHor = fYHor % 64 / 64;
				if (!bRight) fTextureXHor = 1 - fTextureXHor;

				iWallXHor = iWallX;
				iWallYHor = iWallY;

				break;
			}
		}

		x += fDX;
		y += fDY;
	}

	// now check against vertical lines
	var bFoundVer = false;

	var fVerDist = 0;
	var fSlope = fAngleCos / fAngleSin;
	var fDY = 64 * (bUp ? -1 : 1);
	var fDX = fDY * fSlope;
	var y = bUp ? Math.floor(oPlayer.y/64)*64 : Math.ceil(oPlayer.y/64)*64;
	var x = oPlayer.x + (y - oPlayer.y) * fSlope;

	var fTextureXVer;

	var iWallXVer = -1;
	var iWallYVer = -1;

	while (x >= 0 && x < iLevelWidth*64 && y >= 0 && y < iLevelHeight*64) {

		var iWallY = Math.floor((y + (bUp ? -1 : 0)) / 64);
		var iWallX = Math.floor(x / 64);

		if (iWallY >= 0) {
			if (aSpriteImg[iWallY][iWallX] && !aSpriteImg[iWallY][iWallX].visible) {
				aSpriteImg[iWallY][iWallX].visible = true;
				aVisibleSprites.push(aSpriteImg[iWallY][iWallX]);
			}
			if (aWalls[iWallY][iWallX] > 0) {
				// ok, point is in a wall block

				bFoundVer = true;
				fXVer = x;
				fYVer = y;

				var fDistX = fXVer - oPlayer.x;
				var fDistY = fYVer - oPlayer.y;
				fVerDist = fDistX*fDistX + fDistY*fDistY;

				fTextureXVer = fXVer % 64 / 64;
				if (!bUp) fTextureXVer = 1 - fTextureXVer;

				iWallXVer = iWallX;
				iWallYVer = iWallY;

				break;
			}
		}
		x += fDX;
		y += fDY;
	}

	var fDist = 0;
	var fX = 0;
	var fY = 0;
	var fTextureX;
	var iWallX;
	var iWallY;

	var bWallIsVert = false;

	// now find which block we hit, horizontal or vertical (if any).
	if (bFoundHor && (!bFoundVer || fHorDist < fVerDist)) {
		fDist = fHorDist;
		fX = fXHor;
		fY = fYHor;
		fTextureX = fTextureXHor;
		iWallX = iWallXHor;
		iWallY = iWallYHor;
	} else if (bFoundVer) {
		bWallIsVert = true;
		fDist = fVerDist;
		fX = fXVer;
		fY = fYVer;
		fTextureX = fTextureXVer;
		iWallX = iWallXVer;
		iWallY = iWallYVer;
	}

	var oLine = aLines[i];
	var oLineStyle = oLine.style;
	var oLineDesc = oLine.linedesc;
	var oImgStyle = oLine.img.style;
	var oImg = oLine.img;

	// ok, we found a wall block
	if (fDist) {
		fDist = Math.sqrt(fDist);
		var iZ = Math.floor(fDist);

		iTextureIdx = aWalls[iWallY][iWallX];

		// use perpendicular distance to adjust for fish eye
		fDist = fDist * Math.cos(-fHalfFOV+i*fColWidth);

		// calc the position, height and width of the wall strip
		var iHeight = Math.round(fWallHeight / fDist);
		var iWidth = iHeight * iLineWidth;

		var iTexX = Math.round(fTextureX * iWidth);
		if (iTexX > iWidth-iLineWidth)
			iTexX = iWidth-iLineWidth;

		var iTexXShade = iTexX + (bWallIsVert ? iWidth : 0);
		var iTop = Math.round(iScreenHeight/2 - iHeight/2);
		var iImgTop = aWallTextures[iTextureIdx] * iHeight;
		var fWallScale = iHeight/64;

		oLineStyle.zIndex = 100000000 - iZ;

		if (oLineDesc.display != 1) {
			oLineDesc.display = 1;
			oLineStyle.display = "block";
		}

		var bFlickr = false;
		var oFlickrStyle;


		// if the wall texture has a picture frame (texidx 12 and 21) and we are within the picture frame...
		if ((iTextureIdx == 12 || iTextureIdx == 21) && (fTextureX*64) > 7 && (fTextureX*64) < 57 && aFlickrMap[iWallY][iWallX]) {

			var oFlickrDesc = aFlickrMap[iWallY][iWallX];
			/*
			oFlickrStyle = oLine.flickr[oFlickrDesc.imgidx].style;
			oFlickrImgDesc = oLine.flickr[oFlickrDesc.imgidx].imgdesc;
			*/

			oFlickrStyle = oLine.flickrimg.style;
			oFlickrImgDesc = oLine.flickrimg.imgdesc;

			oFlickrStyle.display = "block";

			if (oLine.curflickr != oFlickrDesc.imgidx) {
				oLine.flickrimg.src = aFlickrImages[oFlickrDesc.imgidx].src;
				oLine.curflickr = oFlickrDesc.imgidx;
				//oLine.curflickr.style.display = "none";
			}
			//oLine.curflickr = oLine.flickr[oFlickrDesc.imgidx];

			bFlickr = true;

			var iFlickrHeight = Math.floor((iHeight - ((iTextureIdx == 21 ? 14 : 11)*fWallScale)));
			if (oFlickrImgDesc.height != iFlickrHeight) {
				oFlickrImgDesc.height = iFlickrHeight;
				oFlickrStyle.height = iFlickrHeight +"px";
			}
			if (oFlickrImgDesc.width != iWidth) {
				oFlickrImgDesc.width = iWidth;
				oFlickrStyle.width = iWidth+"px";
			}
			var iFlickrTop = Math.floor((iTextureIdx == 21 ? 8 : 5) * fWallScale);
			if (oFlickrImgDesc.top != iFlickrTop) {
				oFlickrImgDesc.top = iFlickrTop;
				oFlickrStyle.top = iFlickrTop + "px";
			}
			if (oFlickrImgDesc.left != iTexX) {
				oFlickrImgDesc.left = iTexX;
				oFlickrStyle.left = -iTexX + "px";
			}

			if (Math.round(iScreenWidth / i) == 2 && fDist < 256) {
				oLookingAtImg = aFlickrImages[oFlickrDesc.imgidx]; //oFlickrImgDesc.proto;
			}

		} else {
			if (Math.round(iScreenWidth / i) == 2 && iTextureIdx == 3 && fDist < 196) {
				setDescText("Burned out web developer")
			}

			/*
			if (oLine.curflickr) {
				oLine.curflickr.style.display = "none";
				oLine.curflickr = null;
			}
			*/
			oLine.flickrimg.style.display = "none";
		}

		if (oLineDesc.height != iHeight) {
			oLineDesc.height = iHeight;
			oLineStyle.height = iHeight+"px";
			if (bTexturedWalls) oImgStyle.height = iNumWallTextures*iHeight+"px";
		}
		if (oLineDesc.width != iWidth) {
			oLineDesc.width = iWidth;
			if (bTexturedWalls) oImgStyle.width = (iWidth*2)+"px";
		}
		if (oLineDesc.top != iTop) {
			oLineDesc.top = iTop;
			oLineStyle.top = iTop+"px";
		}
		if (oLineDesc.imgtop != iImgTop) {
			oLineDesc.imgtop = iImgTop;
			if (bTexturedWalls) aLines[i].img.style.top = -iImgTop+"px";
		}
		if (oLineDesc.texxshade != iTexXShade) {
			oLineDesc.texxshade = iTexXShade;
			if (bTexturedWalls) oImgStyle.left = -iTexXShade+"px";
		}

	} else {
		if (oLineDesc.display) {
			oLineDesc.display = 0;
			oLineStyle.display = "none";
		}
	}

}

function addEvent(oObject, strEvent, fncAction) {
	if (oObject.addEventListener) { 
		oObject.addEventListener(strEvent, fncAction, false); 
	} else if (oObject.attachEvent) { 
		oObject.attachEvent("on" + strEvent, fncAction); 
	}
}


var fMaxSpeed = 256;
var fMaxRotInc = 120 * fDegRad;

function move(oEntity) {

	var iTime = new Date().getTime();
	var fDeltaTime = Math.min((iTime - oEntity.lastmovetime) / 1000, 0.1);
	oEntity.lastmovetime = iTime;

	if (oEntity.rotincdir) {
		oEntity.rotinc += 180 * oEntity.rotincdir * fDegRad * fDeltaTime;
	} else {
		if (oEntity.rotinc < 0) {
			oEntity.rotinc = Math.min(0, oEntity.rotinc + 1 * fDegRad) * fDeltaTime;
		}
		if (oEntity.rotinc > 0) {
			oEntity.rotinc = Math.max(0, oEntity.rotinc - 1 * fDegRad) * fDeltaTime;
		}
	}

	oEntity.rotinc = Math.min(oEntity.rotinc, fMaxRotInc);
	oEntity.rotinc = Math.max(oEntity.rotinc, -fMaxRotInc);

	oEntity.rotation += oEntity.rotinc * fDeltaTime;

	if (oEntity.rotation < 0)
		oEntity.rotation += fTwoPI;
	if (oEntity.rotation > fTwoPI)
		oEntity.rotation -= fTwoPI;

	oEntity.speed += oEntity.speedinc * fDeltaTime;

	if (oEntity.speed > fMaxSpeed)
		oEntity.speed = fMaxSpeed;
	if (oEntity.speed < -fMaxSpeed)
		oEntity.speed = -fMaxSpeed;

	// move position
	var fMoveY = oEntity.speed * Math.sin(oEntity.rotation) * fDeltaTime;
	var fMoveX = oEntity.speed * Math.cos(oEntity.rotation) * fDeltaTime;

	var fNewPosX = oEntity.x + fMoveX;
	var fNewPosY = oEntity.y + fMoveY;

	moveTo(oEntity, fNewPosX, fNewPosY);

	// decrease speed, if we're not accelerating, automatically decrease speed
	if (!oEntity.speedinc)
		oEntity.speed *= 0.5;

	if (Math.abs(oEntity.speed) < 0.05)
		oEntity.speed = 0;

}

function canMoveToBlock(x, y) {
	if (!aWalls[y]) return false;
	if (aWalls[y][x] != 0) {
		return false;
	}
	return true;
}


// move an entity from its current position to a new position
function moveTo(oEntity, fNewX, fNewY) {

	// new position same as old
	if (oEntity.x == fNewX && oEntity.y == fNewY) return;

	// we want to keep a certain distance to walls
	var iMinDist = 32;

	// moving right/left, up/down?
	var iDirX = (fNewX - oEntity.x) < 0 ? -1 : 1;
	var iDirY = (fNewY - oEntity.y) < 0 ? -1 : 1;

	// map block coords of old position
	var iOldX = Math.floor(oEntity.x / 64);
	var iOldY = Math.floor(oEntity.y / 64);

	// and for new position, with added "padding"
	var iNewX = Math.floor((fNewX + iMinDist*iDirX) / 64);
	var iNewY = Math.floor((fNewY + iMinDist*iDirY) / 64);

	// and for new position with added padding * 0.5
	var iNewX2 = Math.floor((fNewX + iMinDist*0.5*iDirX) / 64);
	var iNewY2 = Math.floor((fNewY + iMinDist*0.5*iDirY) / 64);

	var fMovePosX = oEntity.x;
	var fMovePosY = oEntity.y;


	// check if it's clear diagonally, if not, stop.
	if (canMoveToBlock(iNewX2, iNewY2)) {
		// if we can move to the new X position, do that
		if (canMoveToBlock(iNewX, iOldY)) {
			fMovePosX = fNewX;
		}
		// if we can move to the new Y position, do that
		if (canMoveToBlock(iOldX, iNewY)) {
			fMovePosY = fNewY;
		}
	}
	// this isn't quite right, we should be doing a sphere vs. box intersection thing,
	// but this works for now. If you move directly into a corner, you'll be stopped,
	// but you can still move/glide along walls

	oEntity.x = fMovePosX;
	oEntity.y = fMovePosY;
}


var oDisplayImage;

function checkLookingAtImage() {
	if (oDisplayImage) {
		$("wolfenflickr").removeChild(oDisplayImage);
		oDisplayImage = null;
	} else {
		if (oLookingAtImg) {
			oDisplayImage = new Image();
			oDisplayImage.className = "displayimage";
			oDisplayImage.src = oLookingAtImg.srchigh;
			$("wolfenflickr").appendChild(oDisplayImage);

			oDisplayImage.onclick = function() {
				$("wolfenflickr").removeChild(this);
				oDisplayImage = null;
			}

		}
	}
}


document.onkeydown = function(e) {
	if (!bRunning) return;
	e = e || window.event;

	if (e.keyCode == 17) { // ctrl
		checkLookingAtImage();
		return false;
	}

	if (!(e.ctrlKey||e.altKey)) {
		switch (e.keyCode) {
			case 38: // up
			case 87: // w
				oPlayer.speedinc = 512;	// acceleration, 512 units/s^2
				return (e.keyCode != 38);
			case 37: // left
			case 65: // a
				oPlayer.rotincdir = -1;	// direction of rotation
				return (e.keyCode != 37);
			case 39: // right
			case 68: // d
				oPlayer.rotincdir = 1;
				return (e.keyCode != 39);
			case 40: // down
			case 83: // s
				oPlayer.speedinc = -512; // acceleration, -512 units/s^2
				return (e.keyCode != 40);
		}
	}
}

document.onkeyup = function(e) {
	if (!bRunning) return;
	e = e || window.event;
	switch (e.keyCode) {
		case 38: // up
		case 87: // w
			oPlayer.speedinc = 0;
			break;
		case 37: // left
		case 65: // a
			oPlayer.rotincdir = 0;
			break;
		case 39: // right
		case 68: // d
			oPlayer.rotincdir = 0;
			break;
		case 40: // down
		case 83: // s
			oPlayer.speedinc = 0;
			break;
	}
}


function setDescText(strText) {
	$("description").innerHTML = strText;
}

var aFlickrImages = [];

function getFlickrImages(strUser, strSearch) {
	$("flickrusernamebtn").disabled = true;
	$("flickrsearchbtn").disabled = true;
	bRunning = false;

	Flickr.setAPIKey("15dcd0ac28ab119346a34aaac1aea50a");

	if (strUser) {
		setDescText("Asking Flickr for user ID [\"" + strUser + "\"]...");

		Flickr.callMethod(
			"flickr.people.findByUsername", 
			{
				username : strUser
			}, 
			onUserFound
		);

	} else if (strSearch) {
		setDescText("Asking Flickr for \"" + strSearch + "\"...");

		Flickr.callMethod(
			"flickr.photos.search", 
			{
				text : strSearch,
				extras : "date_taken,owner_name",
				per_page : 20
			}, 
			onPhotosFound
		);
	}
	
	var strUserID = "";

	function onUserFound(oResponse) {
		if (oResponse.user) {
			setDescText("Getting Flickr photos from \"" + strUser + "\"...");

			strUserID = oResponse.user.id;
			Flickr.callMethod(
				"flickr.people.getPublicPhotos", 
				{
					user_id : strUserID,
					extras : "date_taken,owner_name",
					per_page : 20
				}, 
				onPhotosFound
			);
		} else {
			setDescText("User \"" + strUser + "\" not found!");
			setTimeout( function() {
				onPhotosFound({photos:{photo:[]}});
			}, 1000);
		}
	}

	function onPhotosFound(oResponse) {
		aFlickrImages = [];
		for (var i=0;i<oResponse.photos.photo.length;i++) {
			var oPhoto = oResponse.photos.photo[i];
			var strURL = "http://farm" + oPhoto.farm + ".static.flickr.com/" + oPhoto.server + "/" + oPhoto.id + "_" + oPhoto.secret + "_" + (bHighResFlickr ? "m" : "s") + ".jpg";
			var strURLHigh = "http://farm" + oPhoto.farm + ".static.flickr.com/" + oPhoto.server + "/" + oPhoto.id + "_" + oPhoto.secret + ".jpg";

			aFlickrImages.push(
				{
					src : strURL,
					title : oPhoto.title,
					owner : oPhoto.ownername || strUser || "unknown",
					srchigh : strURLHigh
				}
			);
		}
		loadFlickrImages();
	}
}

addEvent($("flickrusernamebtn"), "click",
	function() {
		if ($("flickrusername").value) {
			getFlickrImages($("flickrusername").value);
		}
	}
);

addEvent($("flickrsearchbtn"), "click",
	function() {
		if ($("flickrsearchquery").value) {
			getFlickrImages(null, $("flickrsearchquery").value);
		}
	}
);

function onLevelLoaded() {

	initScreen();
	drawMiniMap();

	setTimeout(function() {
	getFlickrImages("jseidelin");
	},500);
}

function drawMiniMap() {
	if (bRenderMap) {
		fTopMapScale = oTopMap.width / iLevelWidth;
	
		oTopMap.width=oTopMap.width;
		var oCtx = oTopMap.getContext("2d");
		for (var y=0;y<iLevelHeight;y++) {
			for (var x=0;x<iLevelWidth;x++) {
				if (aWalls[y][x] > 0) {
					if (aWalls[y][x] == 12 || aWalls[y][x] == 21) {
						oCtx.fillStyle = "rgb(255,255,200)";
					} else {
						oCtx.fillStyle = "rgb(200,200,200)";
					}
					oCtx.fillRect(x * fTopMapScale,y * fTopMapScale,fTopMapScale,fTopMapScale);
				}
			}
		}
	}
}


function loadFlickrImages() {

	var aImages = [];
	for (var i=0;i<aFlickrImages.length;i++) {
		aImages[i] = new Image();
		aImages[i].style.position = "absolute";
		aImages[i].style.left = "-10000px";
		aImages[i].src = aFlickrImages[i].src;
		document.body.appendChild(aImages[i]);
	}
	setDescText("Loading Flickr images...(0/" + aImages.length + ")");

	//var iInterval = setInterval(
	var fncCheck = function() {
		var iComplete = 0;
		var bAll = true;
		for (var i=0;i<aImages.length;i++) {
			if (!aImages[i].complete) {
				bAll = false;
			} else {
				iComplete++;
			}
		}
		if (bAll) {
			for (var i=0;i<aImages.length;i++) {
				aImages[i].ratio = aImages[i].offsetWidth / aImages[i].offsetHeight;
				aFlickrImages[i].img = aImages[i];
				document.body.removeChild(aImages[i]);
			}
			//clearInterval(iInterval);
			initFlickrImages();

			setTimeout(
				function() {
					setDescText("Welcome to WolfenFlickr 3D!");
					startGame();
				}, 10
			);
		} else {
			setDescText("Loading Flickr images...(" + iComplete + "/" + aImages.length + ")");
			setTimeout(fncCheck, 50);
		}
	}
	fncCheck();
}


var aFlickrMap = [];

function initFlickrImages() {
	setDescText("Adding Flickr images to world...");

	aFlickrMap = [];
	for (var y=0;y<iLevelHeight;y++) {
		aFlickrMap[y] = [];
	}

	if (aFlickrImages.length) {
		var iIdx = 0;
		for (var y=0;y<iLevelHeight;y++) {
			for (var x=0;x<iLevelWidth;x++) {
				if (aWalls[y][x] == 12 || aWalls[y][x] == 21) {
					aFlickrMap[y][x] = {
						imgidx : iIdx,
						imgsrc : aFlickrImages[iIdx] // not used?
					}
					iIdx++;
					if (iIdx == aFlickrImages.length) {
						iIdx = 0;
					}
				}
			}
		}
	}

	for (var i=0;i<iScreenWidth;i+=iLineWidth) {
		var oLine = aLines[i];

		/*
		if (oLine.flickr) {
			for (var a=0;a<oLine.flickr.length;a++) {
				oLine.removeChild(oLine.flickr[a]);
			}
		}
		oLine.flickr = [];
		*/

		if (oLine.flickrimg)
			oLine.removeChild(oLine.flickrimg);


		var oFImg = new Image();
		oFImg.style.position = "absolute";
		oFImg.style.border = "none";
		oFImg.style.padding = "0px";
		oFImg.style.margin = "0px";
		oFImg.style.left = "0px";
		oFImg.style.width = "0px";
		oFImg.style.height = "0px";
		oFImg.style.display = "none";
		oFImg.imgdesc = {};

		oLine.flickrimg = oFImg;
		oLine.appendChild(oFImg);

		/*
		for (var a=0;a<aFlickrImages.length;a++) {
			var oFImg = new Image();
			oFImg.style.position = "absolute";
			oFImg.style.border = "none";
			oFImg.style.padding = "0px";
			oFImg.style.margin = "0px";
			oFImg.style.left = "0px";
			oFImg.style.width = "0px";
			oFImg.style.height = "0px";
			oFImg.style.display = "none";

			oFImg.imgdesc = {};
		
			oLine.appendChild(oFImg);
			oLine.flickr.push(oFImg);

			oFImg.src = aFlickrImages[a].src;
			oFImg.imgdesc.proto = aFlickrImages[a];
		}
		*/
	}

}


addEvent($("lowreswalls"), "click",
	function() {
		bRunning = false;
		setDescText("Rebuilding screen...");
		$("lowreswalls").disabled = true;
		setTimeout(
			function() {
				var bLowRes = $("lowreswalls").checked;
				if (bLowRes) {
					iLineWidth = 6;
				} else {
					iLineWidth = 3;
				}
				initScreen();
				initFlickrImages();
				bRunning = true;
				$("lowreswalls").disabled = false;
			}, 10
		);
	}
);

setDescText("Loading level...");
loadLevel("gallery");

}

window.onload = WolfenFlickr;

