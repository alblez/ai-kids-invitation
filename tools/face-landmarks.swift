import Foundation
import Vision
import AppKit

// Print eye midpoint, face-box centre/height in top-left image pixel coordinates.
guard CommandLine.arguments.count == 2,
      let image = NSImage(contentsOfFile: CommandLine.arguments[1]),
      let data = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: data),
      let cgImage = bitmap.cgImage else {
    fputs("Cannot read image\n", stderr)
    exit(1)
}
let request = VNDetectFaceLandmarksRequest()
do {
    try VNImageRequestHandler(cgImage: cgImage).perform([request])
} catch {
    fputs("Vision request failed: \(error)\n", stderr)
    exit(1)
}
guard let face = request.results?.max(by: { $0.confidence < $1.confidence }),
      let left = face.landmarks?.leftEye?.normalizedPoints,
      let right = face.landmarks?.rightEye?.normalizedPoints,
      !left.isEmpty, !right.isEmpty else {
    fputs("No face with both eye landmarks detected\n", stderr)
    exit(1)
}
let box = face.boundingBox
let width = Double(cgImage.width), height = Double(cgImage.height)
func centre(_ points: [CGPoint]) -> CGPoint {
    CGPoint(x: points.map(\.x).reduce(0, +) / CGFloat(points.count),
            y: points.map(\.y).reduce(0, +) / CGFloat(points.count))
}
let l = centre(left), r = centre(right)
let eyeX = (box.minX + box.width * (l.x + r.x) / 2) * width
let eyeY = (1 - box.minY - box.height * (l.y + r.y) / 2) * height
let faceX = box.midX * width
let faceY = (1 - box.midY) * height
print(String(format: "%.3f %.3f %.3f %.3f %.3f %.3f", eyeX, eyeY, faceX, faceY, box.height * height, face.confidence))
