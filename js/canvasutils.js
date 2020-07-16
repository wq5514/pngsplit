let canvasutils = {}
	
//Classes----------------------------------------------------
function mikuLoc(locX,locY){
	this.x = locX;
	this.y = locY;
}

//Contents---------------------------------------------------
var GRID_STYLE  = "lightgray",
	GRID_LINE_WIDTH = 0.5;
 
var AXES_STYLE  = "#CC0001",
	AXES_LINE_WIDTH = 1,
	VERTICAL_TICK_SPACING = 10,
	HORIZONTAL_TIKE_SPACING = 10,
	TICK_WIDTH = 10;
	
var defaultCanvasWidth = 512,
	defaultCanvasHeight = 512;
	
var canvas,
	context,
	//正在绘制的绘图表面变量
	drawingSurfaceImageData,
	//鼠标按下相关对象
	mousedown = {},
	//橡皮筋矩形对象
	rubberbandRect = {},
	//拖动标识变量
	dragging = false;
	
var	bufferCanvas;
var bufferCanvasX;
	
var eraseAllButton,
	axesCheckBox,
	gridCheckBox,
	gridFrontCheckBox,
	guideWiresCheckBox,
	strokeColorSelectBox,
	lineTypeSelectBox,
	lineWidthSelectBox;
	
var	picSlicePerWidthBox,
	picSlicePerHeightBox,
	picSlicePerWidthBatchBox,
	picSlicePerHeightBatchBox,
	picSlicePerWidthPxBox,
	picSlicePerHeightPxBox,
	picPaddingPxBox,
	picForceSquaredBox;
	
var picSlicePerWidth,
	picSlicePerHeight;

let backgroundImageBox;
let hasImage;
let showmenu, showinfo, exportPlist, exportPng;
let shouldPlayBack;
let targetFile = {
	name: '',
	filename: '', // 带后缀
	size: '',
};
let selectPicInfo = {
	name: '',
	x: 0,
	y: 0,
	hasSelected: false,
	lastname: '',
}

//Function---------------------------------------------------
//绘制网格
//传入参数为：绘图环境,x轴间隔，y轴间隔
function drawGrid(context,stepx,stepy){
	context.save();
	context.strokeStyle = GRID_STYLE;
	//设置线宽为0.5
	context.lineWidth   = GRID_LINE_WIDTH;
	
	//绘制x轴网格
	//注意：canvas在两个像素的边界处画线
	//由于定位机制，1px的线会变成2px
	//于是要+0.5
	for(var i=stepx+0.5;i<context.canvas.width;i=i+stepx){
		//开启路径
		context.beginPath();
		context.setLineDash([8,8])
		context.moveTo(i,0);
		context.lineTo(i,context.canvas.height);
		context.stroke();
		}
		//绘制y轴网格
	for(var i=stepy+0.5;i<context.canvas.height;i=i+stepy){
		context.beginPath();
		context.setLineDash([8,8])
		context.moveTo(0,i);
		context.lineTo(context.canvas.width,i);
		context.stroke();
		}
		
	context.restore();
	context.setLineDash([0,0]);
};


//Function---------------------------------------------------
//绘制坐标轴
//传入参数为：绘图环境,坐标轴边距
function drawAxes(context,axesMarginX, axesMarginY){
	//保存样式
	context.save();
	// var originLoc = new mikuLoc(axesMarginX - AXES_LINE_WIDTH, context.canvas.height-axesMarginY + AXES_LINE_WIDTH);
	var originLoc = new mikuLoc(axesMarginX - AXES_LINE_WIDTH *0.5, context.canvas.height - axesMarginY + AXES_LINE_WIDTH *0.5);
	var axesW = context.canvas.width  - (axesMarginX),
		axesH = context.canvas.height - (axesMarginY);
	//设置坐标绘图样式绘图样式
	context.strokeStyle   =  AXES_STYLE;
	context.lineWidth =   AXES_LINE_WIDTH;
	//绘制x,y轴
	drawHorizontalAxis();
	drawVerticalAxis();
	// drawVerticalAxisTicks();
	// drawHorizontalAxisTicks();
	//恢复样式
	context.restore();
	
	//绘制x轴
	function drawHorizontalAxis(){
		context.beginPath();
		context.moveTo(originLoc.x, originLoc.y);
		context.lineTo(originLoc.x + axesW, originLoc.y);
		context.stroke();
	}
	//绘制y轴
	function drawVerticalAxis(){
		context.beginPath();
		context.moveTo(originLoc.x, originLoc.y);
		context.lineTo(originLoc.x, originLoc.y - axesH);
		context.stroke();
	}
	//绘制垂直轴小标标
	function drawVerticalAxisTicks(){
		var deltaX;
		//当前垂直tick的y轴坐标
		var nowTickY =originLoc.y-VERTICAL_TICK_SPACING;
		for(var i=1;i<=(axesH/VERTICAL_TICK_SPACING);i++){
			if(i%5 === 0){
				deltaX=TICK_WIDTH;
			}else {
				deltaX=TICK_WIDTH/2;   
			}
			context.beginPath();
			//移动到当前的tick起点
			context.moveTo(originLoc.x-deltaX,nowTickY);
			context.lineTo(originLoc.x+deltaX,nowTickY);
			context.stroke();
			nowTickY=nowTickY-VERTICAL_TICK_SPACING;
		}
	}
	//绘制水平轴小标标
	function drawHorizontalAxisTicks(){
		var deltaY;
		var nowTickX = originLoc.x+HORIZONTAL_TIKE_SPACING;
		 for(var i=1;i<=(axesW/HORIZONTAL_TIKE_SPACING);i++){
			if(i%5 === 0){
				deltaY = TICK_WIDTH;
			}else{
				deltaY = TICK_WIDTH/2;   
			}
			context.beginPath();
			context.moveTo(nowTickX,originLoc.y+deltaY);
			context.lineTo(nowTickX,originLoc.y-deltaY);
			context.stroke();
			nowTickX = nowTickX + HORIZONTAL_TIKE_SPACING;
		}
	}
};

function drawDashedLine(context,x1,y1,x2,y2,dashLength){
	//运用三元表达式实现默认参数
	dashLength = dashLength===undefined ? 5 : dashLength;
	//水平长度
	var deltaX = x2 - x1;
	//垂直长度
	var deltaY = y2 - y1;
	//虚线数量
	var numDashed = Math.floor(
		Math.sqrt(deltaX*deltaX+deltaY*deltaY)/dashLength
	);
	//开始绘制
	context.beginPath();
	for(var i=0; i<numDashed;i++){
		//这种写法太强大了
		//(deltaX/numDashed)是指虚线的长度
		context[i%2===0 ? "moveTo":"lineTo"](x1+(deltaX/numDashed)*i,y1+(deltaY/numDashed)*i);
		}
	//要记得描线啊
	context.stroke();
	//结束绘制
	context.closePath();
}

//Function---------------------------------------------------
//绘制坐标轴
//传入参数为：绘图环境,坐标轴边距
function drawBatchRect(context, width, height){
	let strokeCol = 'rgba(255,0,0, 1)';
	let fillCol = 'rgba(255,0,0, 0.1)';
	drawRect(context,0,0,width,height,strokeCol, fillCol);
};

function drawSelectRect(context, x, y, width, height){
	let strokeCol = 'rgba(95,236,0,1)';
	let fillCol = 'rgba(95,236,0,1)';
	drawRect(context,x,y,width,height,strokeCol, fillCol);
};


//Functions---------------------------------------------------
//将窗口坐标转换为Canvas坐标
//传入参数：窗口坐标(x,y)
function windowToCanvas(x,y){
	//获取canvas元素的边距对象
	var bbox = canvas.getBoundingClientRect();
	//返回一个坐标对象
	//类似json的一种写法
	var scale = g_canvasScaleRate/100
	x/=scale
	y/=scale
	return {
			x : x - bbox.left*(canvas.width/bbox.width),
			y : y - bbox.top*(canvas.height/bbox.height)
		};
}
//保存当前绘图表面数据
function saveDrawingSurface(){
	//从上下文中获取绘图表面数据
	drawingSurfaceImageData = context.getImageData(0,0,canvas.width,canvas.height);
}
//还原当前绘图表面
function restoreDrawingSurface(){
	if(drawingSurfaceImageData == null){
		return
	}
	//将绘图表面数据还原给上下文
	context.putImageData(drawingSurfaceImageData,0,0);
}
//橡皮筋相关函数

//更新橡皮筋矩形+对角线
//传入参数：坐标对象loc
function updateRubberband(loc){
	updateRubberbandRectangle(loc);
	drawRubberbandShape(loc);
}
//更新橡皮筋矩形
//传入参数：坐标对象loc
function updateRubberbandRectangle(loc){
	//获得矩形的宽
	rubberbandRect.width = Math.abs(loc.x - mousedown.x);
	//获得矩形的高
	rubberbandRect.height = Math.abs(loc.y - mousedown.y);
	//获得矩形顶点的位置(left,top)
	//如果鼠标按下的点（起点）在当前点的的左侧
	//这里画一下图就懂了
	if(loc.x > mousedown.x){
		rubberbandRect.left = mousedown.x;
	}else{
		rubberbandRect.left = loc.x;
	}
	if(loc.y > mousedown.y){
		rubberbandRect.top = mousedown.y;
	}else{
		rubberbandRect.top = loc.y;
	}
}
//绘制橡皮筋矩形的对角线
//传入参数：坐标对象loc
function drawRubberbandShape(loc){
	//获取当前线条类型
	var lineType = lineTypeSelectBox.value;
	//获取当前线条颜色
	var lineColor = strokeColorSelectBox.value;
	//获取当前线条宽度
	var lineWidth = lineWidthSelectBox.value;
	//有改变context画笔属性就要做画笔保护
	context.save();
	context.strokeStyle = lineColor;
	context.lineWidth = lineWidth;
	if(lineType === "solid"){
		//alert("draw");
		//注意重新开始路径
		context.beginPath();
		context.moveTo(mousedown.x,mousedown.y);
		//这里可以更改成画虚线
		context.lineTo(loc.x,loc.y);
		context.stroke();   
	}else if(lineType === "dashed"){
		drawDashedLine(context,mousedown.x,mousedown.y,loc.x,loc.y);
	}
	context.restore();
}

//绘制辅助用的线-------------------------
//绘制水平线
function drawHorizontalLine(y){
	context.beginPath();
	context.moveTo(0,y+0.5);
	context.lineTo(context.canvas.width,y+0.5);
	context.stroke();
}
//绘制垂直线
function drawVerticalLine(x){
	context.beginPath();
	context.moveTo(x+0.5,0);
	context.lineTo(x+0.5,context.canvas.height);
	context.stroke();
}
//绘制辅助用的线
function drawGuideWires(x,y){
	//画笔保护
	context.save();
	context.strokeStyle = "red";
	context.lineWidth = 0.5;
	drawHorizontalLine(y);
	drawVerticalLine(x);
	context.restore();
}

// 画方块
function drawRect(context,x,y,w,h,c1,c2){
	context.save();
	context.lineWidth   = 2;
	context.strokeStyle = c1 || "red";
	context.strokeRect(x, y, w, h);

	context.fillStyle = c2 || "blue";
	context.fillOpa
	context.fillRect(x, y, w, h);
	context.restore();
}

// 拆分图片
function getImagePortion(imgObj, startX, startY, newWidth, newHeight,  ratio){
	/* the parameters: - the image element - the new width - the new height - the x point we start taking pixels - the y point we start taking pixels - the ratio */
	//set up canvas for thumbnail
	var clipCanvas = document.createElement('canvas');
	var clipCanvasContext = clipCanvas.getContext('2d');
	clipCanvas.width = newWidth; clipCanvas.height = newHeight;

	/* use the sourceCanvas to duplicate the entire image. This step was crucial for iOS4 and under devices. Follow the link at the end of this post to see what happens when you don’t do this */
	bufferCanvas = bufferCanvas || document.createElement('canvas');
	var bufferContext = bufferCanvas.getContext('2d');
	bufferCanvas.width = imgObj.width;
	bufferCanvas.height = imgObj.height;
	bufferContext.drawImage(imgObj, 0, 0);

	/* now we use the drawImage method to take the pixels from our bufferCanvas and draw them into our thumbnail canvas */
	clipCanvasContext.drawImage(bufferCanvas, startX,startY,newWidth * ratio, newHeight * ratio,0,0,newWidth,newHeight);
	
	return clipCanvas
}
function getImagePortionBase64(imgObj, startX, startY, newWidth, newHeight,  ratio){
	var clipCanvas = getImagePortion(imgObj, startX, startY, newWidth, newHeight,  ratio)
	var dataUrl = clipCanvas.toDataURL()
	var base64str = dataUrl.split('base64,')[1]
	return base64str
}

function changeSourceImage(){
	let w = backgroundImageBox.width
	let h = backgroundImageBox.height
	let nx = picSlicePerWidthBox.value;
	let ny = picSlicePerHeightBox.value;
	let bx = picSlicePerWidthBatchBox.value
	let by = picSlicePerHeightBatchBox.value
	
	let cx = nx/bx
	let cy = ny/by
	let dw = w/nx;
	let dh = h/ny;
	
	let imax = nx*ny
	let padding = Number(picPaddingPxBox.value)
	
	bufferCanvasX = bufferCanvasX || document.createElement('canvas');
	var bufferContext = bufferCanvasX.getContext('2d');
	
	bufferCanvasX.width = canvas.width
	bufferCanvasX.height = canvas.height
	// bufferContext.save()
	for(let i=1;i<=imax;i++){
		let idxData = getPosByIndex(i, dw, dh, nx, ny, bx, by, cx, cy)
		let px = idxData.px
		let py = idxData.py
		let px_padding = px + padding*(idxData.ix+0.5)
		let py_padding = py + padding*(idxData.iy+1)

		let name = `${targetFile.name}_${idxData.fileBigIndexStr}_${idxData.fileSmallIndexStr}`
		if(selectPicInfo.hasSelected && selectPicInfo.name == name){
			selectPicInfo.x = px_padding;
			selectPicInfo.y = py_padding;
		}
		bufferContext.drawImage(backgroundImageBox, px, py, dw, dh, px_padding, py_padding, dw, dh)
	}
	
	// bufferContext.restore()
}

//初始化函数
function initialization(){
	//清除画布
	context.clearRect(0,0,canvas.width,canvas.height);
	let dw = 40,dh = 40
	let show = hasImage ? "inline" : "none"
	let padding = Number(picPaddingPxBox.value)
	let drawGridFront = gridFrontCheckBox.checked
	if(hasImage){
		let w = backgroundImageBox.width
		let h = backgroundImageBox.height
		let nx = picSlicePerWidthBox.value;
		let ny = picSlicePerHeightBox.value;
		dw = w/nx;
		dh = h/ny;
		
		if(padding == 0){
			canvas.width = w;
			canvas.height = h;
		}else{
			canvas.width = (dw+padding)*nx
			canvas.height = (dh+padding)*ny
		}

		picSlicePerWidthPxBox.value = dw;
		picSlicePerHeightPxBox.value = dh;
		
		//绘制网格与坐标的颜色是默认的
		if(axesCheckBox.checked && !drawGridFront){
			let bw = picSlicePerWidthBatchBox.value * (dw + padding)
			let bh = picSlicePerHeightBatchBox.value * (dh + padding)
		   // drawAxes(context, dw, dh);
		   drawBatchRect(context, bw, bh)
		}
	}
	if(gridCheckBox.checked && !drawGridFront){
	   drawGrid(context,dw+padding,dh+padding);
	}
	if(hasImage){
		if(padding == 0){
			context.drawImage(backgroundImageBox, 0, 0, canvas.width, canvas.height)
		}else{
			changeSourceImage()
			if(selectPicInfo.hasSelected){
				let x = selectPicInfo.x-padding*0.5;
				let y = selectPicInfo.y-padding;
				let bw = 1 * (dw + padding)
				let bh = 1 * (dh + padding)
				drawSelectRect(context, x,y,bw, bh)
			}
			context.drawImage(bufferCanvasX, 0, 0, canvas.width, canvas.height)
		}
		//绘制网格与坐标的颜色是默认的
		if(axesCheckBox.checked && drawGridFront){
			let bw = picSlicePerWidthBatchBox.value * (dw + padding)
			let bh = picSlicePerHeightBatchBox.value * (dh + padding)
		   // drawAxes(context, dw, dh);
		   drawBatchRect(context, bw, bh)
		}
	}
	if(gridCheckBox.checked && drawGridFront){
	   drawGrid(context,dw+padding,dh+padding);
	}
	if(!hasImage){
		let textStr = "请把文件拖到网格里!"
		context.fillStyle = 'rgba(255,255,255,1)';
        context.strokeStyle = '#0A84B9';
		context.font="30px Georgia";
		context.textAlign='center';//文本程度对齐方法
		context.textBaseline='middle';//文本垂曲标的目的，基线位置
		context.fillText(textStr, canvas.width/2, canvas.height/2);
		context.strokeText(textStr, canvas.width/2, canvas.height/2);
	}
	Editor.setCanvasRate(g_canvasScaleRate)
}

function initCanvas(){
		// if(1==1){
		// return
	// }
//Vars--------------------------------------------------------
	canvas = document.createElement('canvas')
	canvas.setAttribute("width", defaultCanvasWidth);
	canvas.setAttribute("height", defaultCanvasHeight);
	canvas.id = "pscanvas";
	document.getElementById("container").appendChild(canvas);
	

	
	context =canvas.getContext("2d");
	//正在绘制的绘图表面变量
	drawingSurfaceImageData;
	//鼠标按下相关对象
	mousedown = {};
	//橡皮筋矩形对象
	rubberbandRect = {};
	//拖动标识变量
	dragging = false;
	
	//控件
	//擦除画布的控制
	eraseAllButton = document.getElementById("eraseAllButton");
	//坐标轴的控制
	axesCheckBox = document.getElementById("axesCheckBox");
	//网格线的控制
	gridCheckBox = document.getElementById("gridCheckBox");
	gridFrontCheckBox = document.getElementById("gridFrontCheckBox");
	//辅助线的控制
	guideWiresCheckBox = document.getElementById("guideWiresCheckBox"); 
	//线条颜色的控制
	strokeColorSelectBox =document.getElementById("strokeColorSelectBox");
	//线条样式的控制
	lineTypeSelectBox = document.getElementById("lineTypeSelectBox");
	//线条宽度的控制
	lineWidthSelectBox = document.getElementById("lineWidthSelectBox");
		
	picSlicePerWidthBox = document.getElementById("picSlicePerWidthBox");
	picSlicePerHeightBox = document.getElementById("picSlicePerHeightBox");
	picSlicePerWidthBatchBox = document.getElementById("picSlicePerWidthBatchBox");
	picSlicePerHeightBatchBox = document.getElementById("picSlicePerHeightBatchBox");
	picSlicePerWidthPxBox = document.getElementById("picSlicePerWidthPxBox");
	picSlicePerHeightPxBox = document.getElementById("picSlicePerHeightPxBox");
	
	picPaddingPxBox = document.getElementById("picPaddingPxBox");
	picForceSquaredBox = document.getElementById("picForceSquaredBox");
	
	backgroundImageBox = document.getElementById("backgroundImageBox");
	
	showmenu = document.getElementById('showmenu')
	showinfo = document.getElementById('showinfo')
	exportPlist = document.getElementById('exportPlist')
	exportPng = document.getElementById('exportPng')
	
//Event Hander-----------------------------------------------------
	canvas.onmousedown = function(e){
		if(!hasImage){
			return
		}
		var loc =windowToCanvas(e.clientX,e.clientY);
		e.preventDefault();
		saveDrawingSurface();
		mousedown.x = loc.x;
		mousedown.y = loc.y;
		// dragging = true;
	}
	
	canvas.onmousemove = function(e){
		if(!hasImage){
			return
		}
		var loc;
		if(dragging){
			e.preventDefault();
			loc = windowToCanvas(e.clientX,e.clientY);
			restoreDrawingSurface();
			updateRubberband(loc);
		}
		if(dragging&&guideWiresCheckBox.checked){
			drawGuideWires(loc.x,loc.y);   
		}
	}
	canvas.onmouseup = function(e){
		if(!hasImage){
			return
		}
		loc = windowToCanvas(e.clientX,e.clientY);
		restoreDrawingSurface();
		updateRubberband(loc);
		dragging = false;
		Editor.onClickSprite(loc)
	}
	
	
	let oBox=document.getElementById('showbox');


	oBox.style.display='none';
	/*
	canvas.addEventListener('dragover',(ev)=>{
		console.log("dragover")
		ev.stopPropagation();
		ev.preventDefault();
	},false);
	
	canvas.addEventListener("dragend", (ev)=>{
		console.log("dragend")
		ev.stopPropagation();
		ev.preventDefault();
	}, false);

	canvas.addEventListener('dragenter',(ev)=>{
		console.log("dragenter")
		ev.stopPropagation();
		ev.preventDefault();
	},false);
	canvas.addEventListener('dragleave',(ev)=>{
		console.log("dragleave")
		ev.stopPropagation();
		ev.preventDefault();
	},false);
*/
	let container = document.getElementById("container")
	container.addEventListener('drop',(ev)=>{
		ev.stopPropagation();
		ev.preventDefault()
		// console.log(ev.dataTransfer.files)
		if(!ev.dataTransfer.files.length){
			return;
		}
		var file = ev.dataTransfer.files[0];
		var reader = new FileReader();
		
		let fileName = file.name
		let fileExt = fileName.substr(-4) // .png
		targetFile.name = fileName.replace(fileExt, '');
		targetFile.filename = fileName;
		targetFile.size = file.size;
		
		showinfo.innerHTML=`${targetFile.filename}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;size:${bytesToSize(targetFile.size)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<meter id='m1' value='' min='0' max='100'></meter>`;
		
		backgroundImageBox.src = ""
		if (file.type.substr(0, 5) == "image") {
			reader.onload = function (event) {
				backgroundImageBox.src = event.target.result;
			};
			reader.readAsDataURL(file);
		}
		else if (file.type.substr(0, 4) == "text") {
			reader.readAsText(file);
			reader.onload = function (f) {
				oBox.innerHTML = "<pre>" + this.result + "</pre>";
				oBox.style.background = "white";
			}
		}
		else {
			oBox.innerHTML = "暂不支持此类文件的预览";
			oBox.style.background = "white";
		}
		
		reader.addEventListener('progress',ev=>{
			let meter=document.getElementById('m1');
			meter.value=ev.loaded/ev.total*100
		},false)
	},false)
	
	canvas.width = defaultCanvasWidth;
	canvas.height = defaultCanvasHeight;
	
	//需要擦除的操作需要重新初始化
	

	eraseAllButton.onclick = function(e){
		context.clearRect(0,0,canvas.width,canvas.height);
		initialization();
		saveDrawingSurface();
	}
	axesCheckBox.onchange = function(e){
		initialization();
	}

	gridCheckBox.onchange = function(e){
		initialization();
	}
	gridFrontCheckBox.onchange = function(e){
		initialization();
	}
	gridCheckBox.onchange = function(e){
		shouldPlayBack = !shouldPlayBack;
	}
	
	picSlicePerWidthBox.onchange = function(e){
		picSlicePerWidthBatchBox.value = picSlicePerWidthBox.value
		initialization();
		Editor.shouldRefreshLeftList();
	}
	picSlicePerHeightBox.onchange = function(e){
		picSlicePerHeightBatchBox.value = picSlicePerHeightBox.value
		initialization();
		Editor.shouldRefreshLeftList();
	}
	addMouseWheelEvent(picSlicePerWidthBox, function(e){
		let val = picSlicePerWidthBox.value
		let valMax = 100
		if(e.deltaY < 0){
			val++;
		}else if(e.deltaY > 0){
			val--;
		}
		picSlicePerWidthBox.value = Math.clamp(val, 1, valMax)
		initialization();
		Editor.shouldRefreshLeftList();
	})
	addMouseWheelEvent(picSlicePerHeightBox, function(e){
		let val = picSlicePerHeightBox.value
		let valMax = 100
		if(e.deltaY < 0){
			val++;
		}else if(e.deltaY > 0){
			val--;
		}
		picSlicePerHeightBox.value = Math.clamp(val, 1, valMax)
		initialization();
		Editor.shouldRefreshLeftList();
	})
	
	picSlicePerWidthBatchBox.onchange = function(e){
		initialization();
	}
	picSlicePerHeightBatchBox.onchange = function(e){
		initialization();
	}

	addMouseWheelEvent(picSlicePerWidthBatchBox, function(e){
		// console.log(e)
		let val = picSlicePerWidthBatchBox.value
		let valMax = picSlicePerWidthBox.value
		if(e.deltaY < 0){
			val++;
		}else if(e.deltaY > 0){
			val--;
		}
		picSlicePerWidthBatchBox.value = Math.clamp(val, 1, valMax)
		initialization();
		Editor.shouldRefreshLeftList();
	})

	addMouseWheelEvent(picSlicePerHeightBatchBox, function(e){
		let val = picSlicePerHeightBatchBox.value
		let valMax = picSlicePerHeightBox.value
		if(e.deltaY < 0){
			val++;
		}else if(e.deltaY > 0){
			val--;
		}
		picSlicePerHeightBatchBox.value = Math.clamp(val, 1, valMax)
		initialization();
		Editor.shouldRefreshLeftList();
	})
	
	picPaddingPxBox.onchange = function(e){
		initialization();
	}

	addMouseWheelEvent(picPaddingPxBox, function(e){
		// console.log(e)
		let val = picPaddingPxBox.value
		let valMax = 100
		if(e.deltaY < 0){
			val++;
		}else if(e.deltaY > 0){
			val--;
		}
		picPaddingPxBox.value = Math.clamp(val, 0, valMax)
		initialization();
	})
	
	picForceSquaredBox.onchange = function(e){
		initialization();
	}
	
	backgroundImageBox.onload = function(){
		picSlicePerWidthBox.value = Math.floor(backgroundImageBox.width/picSlicePerWidthPxBox.value)
		picSlicePerHeightBox.value = Math.floor(backgroundImageBox.height/picSlicePerHeightPxBox.value)
		
		hasImage = true;
		selectPicInfo.hasSelected = false;
		initialization();
		Editor.shouldRefreshLeftList();
		Editor.setCanvasRate(g_canvasScaleRate);
	}
	backgroundImageBox.onerror = function(e){
		// console.log("error image")
		// console.log(e)
		hasImage = false;
		
		initialization();
	}
	

	initialization();
}