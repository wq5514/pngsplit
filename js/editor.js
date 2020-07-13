// https://github.com/Stuk/jszip/blob/master/dist/jszip.min.js
// https://github.com/eligrey/FileSaver.js

// window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
// 临时保存的地址C:\Users\Administrator\AppData\Local\Google\Chrome\User Data\Default\File System\014\p\00

var Editor = {};
var curConfig = {
}
var animCanvasWidth = 140;
var animCanvasHeight = 140;
var listSprite = []
var curSpriteAnimIndex = 1;
var dltSpriteAnimIndex = 1;
var fps = 6
var fpsInterval = 1000 / fps
var lastFrameTime = new Date().getTime()

Editor.init = function(){
	let container = document.getElementById("container")
	
	//设置页面属性，不执行默认处理（拒绝被拖放）
	document.ondragover = function(e){e.preventDefault();};
	document.ondrop = function(e){e.preventDefault();}
	document.getElementById("pseditor").onclick = function(e){
		Editor.hideAllMenu()
	}
	// document.getElementById("canvas_anim").onclick = function(e){
		// e.stopPropagation();
	// }
	
	document.getElementById("tool_exportPlist").addEventListener('click',(ev)=>{
		Editor.savePlist()
	})
	document.getElementById("tool_exportPng").addEventListener('click',(ev)=>{
		Editor.savePng()
	})

	document.getElementById("menu_title1").addEventListener('click', (ev)=>{
		ev.stopPropagation();    // 上层加上这行代码，可以阻止点击穿透
		let obj = document.getElementById("file_menu1")
		Editor.hideAllMenu("file_menu1")
		toggleObj(obj)
	})
	document.getElementById("menu_title2").addEventListener('click', (ev)=>{
		ev.stopPropagation();    // 上层加上这行代码，可以阻止点击穿透
		let obj = document.getElementById("file_menu2")
		Editor.hideAllMenu("file_menu2")
		toggleObj(obj)
	})
	document.getElementById("menu_title3").addEventListener('click', (ev)=>{
		ev.stopPropagation();    // 上层加上这行代码，可以阻止点击穿透
		let obj = document.getElementById("file_menu3")
		Editor.hideAllMenu("file_menu3")
		toggleObj(obj)
	})
	
	document.getElementById("zoom_select").onchange = function(e){
		// initialization();
		let val = document.getElementById("zoom_select").value;
		Editor.setCanvasRate(val);
	}


	let val = document.getElementById("zoom_select").value;
	Editor.resetContainer();
	Editor.setCanvasRate(val);
	
	let canvas_anim = document.getElementById("canvas_anim")
	canvas_anim.width = animCanvasWidth;
	canvas_anim.height = animCanvasHeight;
	// addMouseWheelEvent(container, function(e){
	// 	let val = g_canvasScaleRate
	// 	let valMax = 1600
	// 	if(e.deltaY < 0){
	// 		val++;
	// 	}else if(e.deltaY > 0){
	// 		val--;
	// 	}
	// 	console.log()
	// 	val = Math.clamp(val, 0, valMax)
	// 	Editor.setCanvasRate(val);
	// })

	window.onresize = function(){
		Editor.resetContainer()
	};
	
}

Editor.setCssValue = function(key, val){
	let pseditor = document.getElementById("pseditor")
	pseditor.style.setProperty(key, val)
}
Editor.getCssValue = function(key){
	let pseditor = document.getElementById("pseditor")
	let computerStyle = getComputedStyle(pseditor)
	let val = computerStyle.getPropertyValue(key)
	return parseFloat(val)
}

Editor.resetWindowSize = function(){
	winw=window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;
	winh=window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;
	
	console.log(winh)
	Editor.setCssValue('--win_dowW', winw+'px')
	Editor.setCssValue('--win_dowH', winh+'px')
}

Editor.startTick = function(){
	requestAnimationFrame(Editor.loopFunc)
}
Editor.loopFunc = function(){
	
	requestAnimationFrame(Editor.loopFunc)
	
    var curTime = new Date().getTime()
    var dltTime = curTime - lastFrameTime;
    // 经过了足够的时间
    if (dltTime > fpsInterval) {
        lastFrameTime = curTime - (dltTime % fpsInterval); //校正当前时间
        // 循环的代码
        Editor.drawSpriteBatchAnim()
	}
}


Editor.hideAllMenu = function(_objName){
	for(let i=1;i<=3;i++){
		let objName = "file_menu"+i
		if(_objName== null || _objName!= objName){
			hideObj(document.getElementById(objName))
		}
	}
}


Editor.getPlistStr = function(){
	let w = backgroundImageBox.width
	let h = backgroundImageBox.height
	let nx = picSlicePerWidthBox.value;
	let ny = picSlicePerHeightBox.value;
	let bx = picSlicePerWidthBatchBox.value
	let by = picSlicePerHeightBatchBox.value
	
	let padding = Number(picPaddingPxBox.value)

	let cx = nx/bx
	let cy = ny/by
	let dw = w/nx;
	let dh = h/ny;
	
	let listtop = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
		'<plist version="1.0">',
		'    <dict>',
		'        <key>frames</key>',
		'        <dict>'
	]
	let list = []
	let listbot = [
		'        </dict>',
		'        <key>metadata</key>',
		'        <dict>',
		'            <key>format</key>',
		'            <integer>2</integer>',
		'            <key>realTextureFileName</key>',
		`            <string>${targetFile.name}.png</string>`,
		'            <key>size</key>',
		`            <string>{${w},${h}}</string>`,
		'            <key>smartupdate</key>',
		'            <string>$TexturePacker:SmartUpdate:2e5427ebc4c55a1d4a8edbc5e8da6698$</string>',
		'            <key>textureFileName</key>',
		`            <string>${targetFile.name}.png</string>`,
		'        </dict>',
		'    </dict>',
		'</plist>',
	]
	

	
	let imax = nx*ny
	for(let i=1;i<=imax;i++){
		let idxData = getPosByIndex(i, dw, dh, nx, ny, bx, by, cx, cy)
		let fileName = `${targetFile.name}_${idxData.fileBigIndexStr}_${idxData.fileSmallIndexStr}.png`
		let px = idxData.px
		let py = idxData.py
		px = px + padding*(idxData.ix+0.5)
		py = py + padding*(idxData.iy+1)
		
		list.push(`            <key>${fileName}</key>`)
		list.push('            <dict>')
		list.push('                <key>frame</key>')
		list.push(`                <string>{{${px},${py}},{${dw},${dh}}}</string>`)
		list.push('                <key>offset</key>')
		list.push(`                <string>{0,0}</string>`)
		list.push('                <key>rotated</key>')
		list.push(`                <false/>`)
		list.push('                <key>sourceColorRect</key>')
		list.push(`                <string>{{0,0},{${dw},${dh}}}</string>`)
		list.push('                <key>sourceSize</key>')
		list.push(`                <string>{${dw},${dh}}</string>`)
		list.push('            </dict>')
	}


	let str = listtop.concat(list, listbot).join("\n")
	
	return str
}

Editor.savePlist = function (){
	if(!hasImage){
		return
	}
	let str = Editor.getPlistStr()
	
	let blob = new Blob([str], {
		type: "application/plist"
	});
	let url = URL.createObjectURL(blob);
	let link = document.createElement('a');
	link.setAttribute("href", url);
	link.setAttribute("download", `${targetFile.name}.plist`);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

Editor.savePng = function(content, idx){
	if(!hasImage){
		return
	}
	let zip = new JSZip();
	let str = Editor.getPlistStr()
	
	
	let imgData = getImagePortionBase64(bufferCanvasX, 0, 0,canvas.width,canvas.height, 1)
	
	zip.file(`${targetFile.name}.plist`, str);	// plist
	zip.file(`${targetFile.name}.png`, imgData, {base64: true});	// source图片
	
	let img = zip.folder("images_"+targetFile.name);
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
	for(let i=1;i<=imax;i++){
		let idxData = getPosByIndex(i, dw, dh, nx, ny, bx, by, cx, cy)
		let px = idxData.px
		let py = idxData.py
		let imgData = getImagePortionBase64(backgroundImageBox, px, py, dw, dh,1)
		let fileName = `${targetFile.name}_${idxData.fileBigIndexStr}_${idxData.fileSmallIndexStr}.png`
		img.file(fileName, imgData, {base64: true});
	}
	
	zip.generateAsync({type:"blob"}).then(function(content) {
		// see FileSaver.js
		saveAs(content, `${targetFile.name}.zip`);
	});
}

Editor.onClickSprite = function(pos){
	let x = pos.x
	let y = pos.y
	let name = ""
	let padding = Number(picPaddingPxBox.value)
	for(let i=0;i<listSprite.length;i++){
		let dat = listSprite[i]
		let ix = dat.ix
		let iy = dat.iy
		let dw = dat.dw+padding
		let dh = dat.dh+padding
		let px = dw*ix
		let py = dh*iy
		if(x >=px && x <px+dw && y> py&&y<py+dh){
			name = dat.name
			break
		}
	}
	if(name == ""){
		return
	}
	Editor.setSpriteHilight(name)
}
Editor.setSpriteHilight = function(name){
	let lastLi = document.getElementById(selectPicInfo.lastname);
	let curLi = document.getElementById(name);
	selectPicInfo.hasSelected = true;
	selectPicInfo.name = name;
	selectPicInfo.lastname = name;
	if(lastLi){
		lastLi.style.backgroundColor = "transparent"
	}
	curLi.style.backgroundColor='rgba(95,236,0,0.8)';
	initialization();
}
Editor.drawSpriteBatchAnim = function(){
	if(hasImage && selectPicInfo.hasSelected){
		let idx = curSpriteAnimIndex || 1
		let name = selectPicInfo.name
		let curLi = document.getElementById(name);
		if(curLi==null){
			return
		}
		let bul = curLi.parentNode;
		let list = bul.childNodes;
		if(list[idx] == null){
			curSpriteAnimIndex = 1
			dltSpriteAnimIndex = 1
			return
		}
		let img = list[idx].firstChild

		let canvas_anim = document.getElementById("canvas_anim")
		let canvas_anim_ctx = canvas_anim.getContext('2d')
		let nx = picSlicePerWidthPxBox.value;
		let ny = picSlicePerHeightPxBox.value;
		let scale = Math.min(animCanvasWidth/nx,animCanvasHeight/ny)
		canvas_anim.width = nx;
		canvas_anim.height = ny;
		canvas_anim.style.transform = 'scale(' + scale + ')'
		canvas_anim_ctx.drawImage(img,0,0,nx,ny)
		
		
		idx+=dltSpriteAnimIndex;
		
		if(shouldPlayBack){
			// 需要倒放
			if(idx>=list.length){
				dltSpriteAnimIndex = -1;
				idx = list.length+dltSpriteAnimIndex-1
			}else if(idx<=0){
				dltSpriteAnimIndex = 1
				idx = 0+dltSpriteAnimIndex+1
			}
		}else{
			if(idx>=list.length){
				idx = 1
			}
		}

		curSpriteAnimIndex = idx
	}
}


Editor.showImageList = function (){
	if(!hasImage){
		return
	}
	let fileList = document.getElementById("list_left")
	fileList.innerHTML = "";
	
	var list = document.createElement("ul");
	fileList.appendChild(list);
	
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
	
	let bmax = bx*by;
	let imax = nx*ny;
	let bli;
	let bul;
	listSprite = []

	for(let i=1;i<=imax;i++){
		let idxData = getPosByIndex(i, dw, dh, nx, ny, bx, by, cx, cy)
		let px = idxData.px
		let py = idxData.py
		let name = `${targetFile.name}_${idxData.fileBigIndexStr}_${idxData.fileSmallIndexStr}`
		let fileNameSmall = `${idxData.fileSmallIndexStr}.png`
		
		var clipCanvas = getImagePortion(backgroundImageBox, px, py, dw, dh,1)
		var dataUrl = clipCanvas.toDataURL("image/png")
		
		
		if((i-1)%bmax==0){
			bli = document.createElement("li")
			list.appendChild(bli)

			bul = document.createElement("ul")
			bli.appendChild(bul)

			var li = document.createElement("li");
			bul.appendChild(li);

			var info = document.createElement("span");
			info.innerHTML = `${targetFile.name}_${idxData.fileBigIndexStr}_`;
			li.appendChild(info);
		}
		var li = document.createElement("li");
		li.id = name;
		li.onclick = function(e){
			Editor.setSpriteHilight(this.id)
		}
		bul.appendChild(li);

		listSprite.push({name: name, ix:idxData.ix,iy:idxData.iy,dw:dw,dh:dh})
		
		var img = document.createElement("img");
		img.src = dataUrl;
		img.onload = function() {
			window.URL.revokeObjectURL(this.src);
		}
		li.appendChild(img);
		
		var info = document.createElement("span");
		info.innerHTML = fileNameSmall;
		li.appendChild(info);
	}
	
	Editor.setCssValue('--list_left_width', fileList.offsetWidth+'px')
	Editor.resetContainer();
}

Editor.resetContainer = function(){
	let container = document.getElementById("container")
	let pseditor = document.getElementById("pseditor")
	let computerStyle = getComputedStyle(pseditor)
	let w1 = Editor.getCssValue('--list_left_width')
	let w2 = Editor.getCssValue('--list_right_width')
	let w3 = Editor.getCssValue('--padding_all')
	let w = winw  - (w1 + w2 + w3*2)
	
	let h1 = Editor.getCssValue('--list_top_height')
	let h2 = Editor.getCssValue('--list_bot_height')
	let h3 = Editor.getCssValue('--padding_all')
	let h4 = Editor.getCssValue('--show_menu_height')
	let h = winh  - (h1 + h2 + h3*2 + h4)
	
	container.style.width = w+"px";
	container.style.height = h+"px";
}
Editor.setCanvasRate = function(val){
	document.getElementById("zoom").value = val
	g_canvasScaleRate = val
	let scale = g_canvasScaleRate/100
	let w = container.style.width
	let h = container.style.height
	w = parseInt(w)
	h = parseInt(h)
	w = Math.max(w, canvas.width*scale+20)
	h = Math.max(h, canvas.height*scale+20)
	// let canvasbox = document.getElementById("canvasbox")

	// canvasbox.style.width = canvas.width*scale+20+"px";
	// canvasbox.style.height = canvas.height*scale+20+"px";
	canvas.style.transform = 'scale(' + scale + ')'
	canvas.style["margin-left"] = (w -canvas.width)/2+"px";
	canvas.style["margin-right"] = (w -canvas.width)/2+"px";
	canvas.style["margin-top"] = ( h-canvas.height)/2+"px";
	canvas.style["margin-bottom"] = (h -canvas.height)/2+"px";


	// Editor.resetContainer();
}


var Actions = function(){
	
}
