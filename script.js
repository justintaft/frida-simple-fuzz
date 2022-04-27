function generateOffsetLength(ptr, bufferLength) {
    //TODO error when buffer length <=0 bytes

    var offset = Math.floor(Math.random() * (bufferLength-1));
    var maxLength = bufferLength-offset;
    return { ptr: ptr.add(offset), length: maxLength };
}



function writeByte(ptr, offset, value) {
    var tmpPtr = ptr.add(offset);
    tmpPtr.writeU8(value);

}


function readByte(ptr, offset) {
    var tmpPtr = ptr.add(offset);
    return tmpPtr.readU8();
}


function genRandomByte() {
    return Math.floor(Math.random()* 255);
}

function genPositiveIntBetween(min, max) {
    return Math.floor(Math.random() * (max-min)) + min;
}

function flip1Byte(ptr, length) {

    var writeTarget = generateOffsetLength(ptr,length);
    var newValue = Math.floor(Math.random() * 255);
    writeByte(writeTarget.ptr,0,newValue);
}


function flipUpTo4Bytes(ptr, length) {
    var writeTarget = generateOffsetLength(ptr,length);
    for (var i = 0; i < Math.min(writeTarget.length, 4); i++) {
        writeByte(ptr, i, genRandomByte());
    }
}




var specialValues = [
    [0xff, 0xff, 0xff, 0xff],
    [0x00, 0x00, 0x00, 0x00],
    [0x01],
    [0x01, 0x00, 0x00, 0x00]];


function writeSpecialValue(ptr,length) {
    var writeTarget = generateOffsetLength(ptr,length);
    var specialValueIndex = genPositiveIntBetween(0, specialValues.length-1);
    var specialValue = specialValues[specialValueIndex];

    var maxWrite = Math.min(specialValue.length,writeTarget.length);
    
    for (var i = 0; i < maxWrite; i++ ) {
        writeByte(ptr, i, specialValue[i]);
    }
}



function insertLetterAs(ptr, length) {

    var offset = generateOffsetLength(ptr,length);
    var count = genPositiveIntBetween(0, Math.min(offset.length,8));
    for (var i = 0; i < count; i++) {
        writeByte(offset.ptr, i, 0x41);
    }
}

function copyRandomBytes(ptr, length) {
    var srcOffset = generateOffsetLength(ptr,length);
    var destOffset = generateOffsetLength(ptr,length);
    var count = genPositiveIntBetween(0, 32);

    for (var i = 0; i < srcOffset.length && i < destOffset.length && i < count; i++) {
        writeByte(destOffset.ptr, i, readByte(srcOffset.ptr, i));

    }

    
}

function increaseOrDecreaseByte(ptr, length) {
    var offset = generateOffsetLength(ptr, length);
    var value = readByte(ptr, 0);
    if (genPositiveIntBetween(0, 1) == 0) {
        value -= 1;
    } else {
        value += 1;
    }
    writeByte(offset.ptr,0,value & 0xff);
}


function dumpBuff(ptr, length) {
    console.log(hexdump(ptr,
        {
            size: length,
            ansi: true
        }
    ));
}



var mutators = [
    insertLetterAs,
    writeSpecialValue,
    flipUpTo4Bytes,
    increaseOrDecreaseByte,
    copyRandomBytes,


    //Repeat a few times to make flipping 1 bit more likely then other mutators.
    flip1Byte,
    flip1Byte,
    flip1Byte,
    flip1Byte,
];


var writeFile = Module.getExportByName(null, "WSASend");


Interceptor.attach(writeFile, {
    onEnter: function (args) {
       


        var bufferLocationPtr = args[1];




        console.log("WSA Buffer Location Ptr: " + bufferLocationPtr + "\n");


        var wsaLength = bufferLocationPtr.readUInt();x

        var wsaDataPtr = bufferLocationPtr.add(4);

        wsaDataPtr = wsaDataPtr.readPointer();

        //console.log("Before Flip: ");
        //dumpBuff(wsaDataPtr, wsaLength);
        
        var mutationCount = genPositiveIntBetween(0, 3);
        for (var  i = 0; i < mutationCount; i++) {
            var mutator = mutators[genPositiveIntBetween(0, mutators.length - 1)];

            console.log("Running mutator",mutator.name);
            mutator(wsaDataPtr, wsaLength);
        }

      
        //console.log("After flip: ");
        //dumpBuff(wsaDataPtr, wsaLength);



}});
