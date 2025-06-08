// Import gl-matrix for matrix operations
// If using modules, uncomment the following line:
// import { mat4 } from 'gl-matrix';
// If using a script tag, ensure gl-matrix.js is included in your HTML before this script.

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

// Check if WebGL is available
if (!gl) {
	alert("Unable to initialize WebGL.");
} else {
	console.log("WebGL initialized successfully.");
}

// Define cube vertices (8 corners of the cube)
const vertices = [
	-1.0, -1.0,  1.0,  // front-bottom-left
	 1.0, -1.0,  1.0,  // front-bottom-right
	 1.0,  1.0,  1.0,  // front-top-right
	-1.0,  1.0,  1.0,  // front-top-left
	-1.0, -1.0, -1.0,  // back-bottom-left
	 1.0, -1.0, -1.0,  // back-bottom-right
	 1.0,  1.0, -1.0,  // back-top-right
	-1.0,  1.0, -1.0   // back-top-left
];

// Define per-vertex colors (one color for each vertex)
const colors = [
	1, 0, 0,  // red
	0, 1, 0,  // green
	0, 0, 1,  // blue
	1, 1, 0,  // yellow
	1, 0, 1,  // magenta
	0, 1, 1,  // cyan
	1, 1, 1,  // white
	0, 0, 0   // black
];

// Define how vertices form triangles for each face (index buffer)
const indices = [
	0, 1, 2,  0, 2, 3,  // Front face
	4, 5, 6,  4, 6, 7,  // Back face
	0, 1, 5,  0, 5, 4,  // Bottom face
	3, 2, 6,  3, 6, 7,  // Top face
	0, 4, 7,  0, 7, 3,  // Left face
	1, 5, 6,  1, 6, 2   // Right face
];

// Create and upload vertex buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create and upload color buffer
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Create and upload index buffer
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// Vertex shader source code
const vsSource = `
	attribute vec3 aVertexPosition;
	attribute vec3 aVertexColor;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	varying lowp vec3 vColor;

	void main(void) {
		gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
		vColor = aVertexColor;
	}
`;

// Fragment shader source code
const fsSource = `
	varying lowp vec3 vColor;
	void main(void) {
		gl_FragColor = vec4(vColor, 1.0);
	}
`;

// Shader compilation helper function
function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('Shader compile error: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

// Compile vertex and fragment shaders
const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

// Create and link shader program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

// Check if program linked successfully
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert('Shader program link error: ' + gl.getProgramInfoLog(shaderProgram));
}

// Store attribute and uniform locations
const programInfo = {
	program: shaderProgram,
	attribLocations: {
		vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
	},
	uniformLocations: {
		projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
	},
};

// Main draw function to render the scene
function drawScene() {
	// Clear the canvas and depth buffer before drawing
	gl.clearColor(0, 0, 0, 1);  // Black background
	gl.clearDepth(1);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Set up the perspective projection matrix
	const fov = 45 * Math.PI / 180; // 45 degree field of view
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

	// Set up the model-view matrix for positioning and rotating the cube
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);  // Move cube away from camera
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0]);  // Rotate around Y-axis
	mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [1, 0, 0]); // Rotate around X-axis

	// Bind the vertex position buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

	// Bind the color buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

	// Bind the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	// Use the shader program and set the uniform matrices
	gl.useProgram(programInfo.program);
	gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

	// Draw the cube using indexed drawing
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

// Initialize rotation state
let cubeRotation = 0.0;

// Animation loop using requestAnimationFrame
function render(now) {
	now *= 0.001;  // Convert time to seconds
	cubeRotation += 0.01;  // Increment rotation
	drawScene();
	requestAnimationFrame(render);  // Request next frame
}

// Start rendering
requestAnimationFrame(render);
