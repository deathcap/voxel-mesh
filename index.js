var THREE = require('three')
var isndarray = require('isndarray')

module.exports = function(data, mesher, scaleFactor, three, mesherExtraData) {
  return new Mesh(data, mesher, scaleFactor, three, mesherExtraData)
}

module.exports.Mesh = Mesh

function Mesh(data, mesher, scaleFactor, three, mesherExtraData) {
  this.THREE = three || THREE
  this.data = data
  var geometry = this.geometry = new this.THREE.Geometry()
  this.scale = scaleFactor || new this.THREE.Vector3(10, 10, 10)

  var result, voxels, dims
  if (isndarray(data)) {
    voxels = data.data
    dims = data.shape
  } else {
    voxels = data.voxels
    dims = data.dims
  }

  result = mesher( voxels, dims, mesherExtraData )
  this.meshed = result

  geometry.vertices.length = 0
  geometry.faces.length = 0

  for (var i = 0; i < result.vertices.length; ++i) {
    var q = result.vertices[i]
    geometry.vertices.push(new this.THREE.Vector3(q[0], q[1], q[2]))
  } 
  
  for (var i = 0; i < result.faces.length; ++i) {
    var q = result.faces[i]
    if (q.length === 5) {
      var uv = this.faceVertexUv(i)

      var f = new this.THREE.Face3(q[0], q[1], q[3])
      f.color = new this.THREE.Color(q[4])
      geometry.faces.push(f)
      geometry.faceVertexUvs[0].push([uv[0], uv[1], uv[3]])

      var g = new this.THREE.Face3(q[1], q[2], q[3])
      g.color = new this.THREE.Color(q[4])
      geometry.faces.push(g)
      geometry.faceVertexUvs[0].push([uv[1], uv[2], uv[3]])
    } else if (q.length == 4) {
      var f = new this.THREE.Face3(q[0], q[1], q[2])
      f.color = new this.THREE.Color(q[3])
      geometry.faces.push(f)
      geometry.faceVertexUvs[0].push(this.faceVertexUv(i))
    }
  }
  
  geometry.computeFaceNormals()

  geometry.verticesNeedUpdate = true
  geometry.elementsNeedUpdate = true
  geometry.normalsNeedUpdate = true

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

}

Mesh.prototype.createWireMesh = function(hexColor) {    
  var wireMaterial = new this.THREE.MeshBasicMaterial({
    color : hexColor || 0xffffff,
    wireframe : true
  })
  wireMesh = new this.THREE.Mesh(this.geometry, wireMaterial)
  wireMesh.scale = this.scale
  wireMesh.doubleSided = true
  this.wireMesh = wireMesh
  return wireMesh
}

Mesh.prototype.createSurfaceMesh = function(material) {
  material = material || new this.THREE.MeshNormalMaterial()
  var surfaceMesh  = new this.THREE.Mesh( this.geometry, material )
  surfaceMesh.scale = this.scale
  surfaceMesh.doubleSided = false
  this.surfaceMesh = surfaceMesh
  return surfaceMesh
}

Mesh.prototype.addToScene = function(scene) {
  if (this.wireMesh) scene.add( this.wireMesh )
  if (this.surfaceMesh) scene.add( this.surfaceMesh )
}

Mesh.prototype.setPosition = function(x, y, z) {
  if (this.wireMesh) this.wireMesh.position = new this.THREE.Vector3(x, y, z)
  if (this.surfaceMesh) this.surfaceMesh.position = new this.THREE.Vector3(x, y, z)
}

Mesh.prototype.faceVertexUv = function(i) {
  var vs = [
    this.meshed.vertices[i*4+0],
    this.meshed.vertices[i*4+1],
    this.meshed.vertices[i*4+2],
    this.meshed.vertices[i*4+3]
  ]
  var spans = {
    x0: vs[0][0] - vs[1][0],
    x1: vs[1][0] - vs[2][0],
    y0: vs[0][1] - vs[1][1],
    y1: vs[1][1] - vs[2][1],
    z0: vs[0][2] - vs[1][2],
    z1: vs[1][2] - vs[2][2]
  }
  var size = {
    x: Math.max(Math.abs(spans.x0), Math.abs(spans.x1)),
    y: Math.max(Math.abs(spans.y0), Math.abs(spans.y1)),
    z: Math.max(Math.abs(spans.z0), Math.abs(spans.z1))
  }
  if (size.x === 0) {
    if (spans.y0 > spans.y1) {
      var width = size.y
      var height = size.z
    }
    else {
      var width = size.z
      var height = size.y
    }
  }
  if (size.y === 0) {
    if (spans.x0 > spans.x1) {
      var width = size.x
      var height = size.z
    }
    else {
      var width = size.z
      var height = size.x
    }
  }
  if (size.z === 0) {
    if (spans.x0 > spans.x1) {
      var width = size.x
      var height = size.y
    }
    else {
      var width = size.y
      var height = size.x
    }
  }
  if ((size.z === 0 && spans.x0 < spans.x1) || (size.x === 0 && spans.y0 > spans.y1)) {
    return [
      new this.THREE.Vector2(height, 0),
      new this.THREE.Vector2(0, 0),
      new this.THREE.Vector2(0, width),
      new this.THREE.Vector2(height, width)
    ]
  } else {
    return [
      new this.THREE.Vector2(0, 0),
      new this.THREE.Vector2(0, height),
      new this.THREE.Vector2(width, height),
      new this.THREE.Vector2(width, 0)
    ]
  }
}
;
