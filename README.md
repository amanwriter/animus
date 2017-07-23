# Animus
Make books come alive through Augmented Reality

## How to use

1. Clone the repository and navigate to 'backend/' folder to install the requirements for the Python server
`pip3 install -r requirements.txt`
2. Use OpenSSL to create a SSL certificate and key (We need to be hosted on HTTPS to access Device camera on modern browsers).
3. Run db.sql after creating a Postgres database and update the connection credentials in api.py
4. Run api.py (You'll be prompted for the SSL key passphrase)
5. Navigate to https://<host>:<port>/admin/index.html to open the admin panel and create pages. Some sample images have been included in the pages directory.
6. Add trigger after following the instructions on the admin UI (read below section for caveats)
7. Update the Postgres tables by setting the active flag to true if you wish to publish the pages and triggers
8. Open https://<host>:<port>/reader.html to open the reader, preferably on a large and bright screen
9. On you smartphone device browser navigate to https://<host>:<port>/viewer/index.html to open the lens and point the camera at the window opened above to see the page showing trigger points on the selected coordinates and other AR components
10. Without publishing the changes you can also view the results by opening https://<host>:<port>/viewer/index.html#debug on your smartphone browser and point it at the admin panel

> Note: In case you face performance issues on your low-end smartphone, you can also reverse the reader and viewer, by opening the Reader page in landscape mode on your smartphone and the Viewer page on your laptop. Display your smartphone screen to the laptop's webcam.

## Trigger resources

The following points need to be kept in mind while working with creating resources for triggers and adding them to the pages:
- Location and Information
  - Upload only images for these trigger types, and ensure that their size is not too large as these are loaded at run-time for the users
- Videos
  - Upload low-quality MP4 format videos that are not too long. If image quality is too high, the processing cost increases and framerate decreases on the user's side.
- 3D Models
  - This trigger type requires uploading a HTML file with a canvas element with the id '3dmodel'
  - This resource is attached as an iframe to the main viewer and whatever is drawn on the canvas is projected at the corresponding trigger's bounding box
  - You can find examples of sample input in the '3dmodels/' directory

## How it works

Animus is primarily composed of the following 2 components:

### Reader

This page just renders the page image surrounded by AR markers. This is done so that the viewer device can quickly identify the location and position of the page and overlay the AR components accordingly. Moreover, since every AR marker has a different appearance and ID, the combination of the 4 markers on the page also help the Viewer identify which page is it pointed at and thus request the server to fetch the Triggers for that page and render them.

### Viewer

- The viewer captures image from the device camera and uses the awesome js-Aruco markers library (https://github.com/diogok/js-aruco-markers) to detect the AR markers in the video stream. This information is used to send a request to the server to fetch all Triggers for the page along with their location. These triggers were created using the Admin panel as discussed above.
  > Instead of choosing one AR marker and transforming everything based on that, 4 corners were chosen to make the calculations simpler and also encode more page numbers by using the combination of their IDs.

- Before rendering the Triggers on the screen, we also need to perform a Perspective Transformation to go from the co-ordinates of the flat image (where the admin added the triggers) to that of the skewed image which the user is seeing. This was done using the amazing glfx library (http://evanw.github.io/glfx.js/), and the individual transform for the trigger points was done by using perspective-transform library (https://github.com/jlouthan/perspective-transform).

- The Viewer also has Bootstrap modals to show additional information when a user interacts with a trigger point.

## Demo

Demo description: https://github.com/amanwriter/animus/blob/master/DEMO.md
Demo video: https://www.youtube.com/watch?v=vfg5smFCo4U
