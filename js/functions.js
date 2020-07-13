Math.clamp = function(a,b,c){
	if(a < b){
		return b
	}else if(a > c){
		return c
	}
	return a
}

function formatZero(num, len) {
	if(String(num).length > len) return num;
	return (Array(len).join(0) + num).slice(-len);
}
function bytesToSize(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1000, // or 1024
		sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
 
   return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function getPosByIndex(i, dw, dh, nx, ny, bx, by, cx, cy){
	let num1 = nx*ny
	let num2 = bx*by

	
	let x = Math.floor((i-1)/num2)
	let y = (i-1)%num2
	
	let xbig = x%cx
	let ybig = Math.floor((x)/cx)
	
	let xsmall = y%bx
	let ysmall = Math.floor(y/bx)
	
	let ix = xbig*bx + xsmall
	let iy = ybig*by + ysmall
	
	let px = ix*dw
	let py = iy*dh
	
	return {
		ix: ix,
		iy: iy,
		px: px,
		py: py,
		count_big: x,
		count_small: y,
		fileBigIndexStr: formatZero(x+1,3),
		fileSmallIndexStr: formatZero(y+1,3)
	}
}

function addMouseWheelEvent(obj, callFunc){
	obj.addEventListener("mousewheel", callFunc, passiveSupported ? { passive: true } : false)
}
function toggleObj(obj){
	obj.style.display = obj.style.display == "" ? "block" : "";
}
function hideObj(obj){
	if(obj.style.display == "block"){
		obj.style.display = "";
	}
}