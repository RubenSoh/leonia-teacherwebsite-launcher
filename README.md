# Leonia Teacher Website Launcher

*View the [live demo](https://leoniateachers.rubensoh.org/) at https://leoniateachers.rubensoh.org*.

<img src="https://i.imgur.com/Pz4e1Uk.png" width="700" />


<img src="https://i.imgur.com/L4lz5VC.png" width="700" />

## About

The Leonia Teacher Website Launcher (TWL) is a client-side JAMStack Single Page Application employing responsive,
mobile-first design created for searching and launching the teacher websites of teachers in the Leonia School district.

**The TWL uses the currently available Google Sheets spreadsheets as a data source, and will update accordingly
when they are changed.** This means that the application is easily used, requiring no extra configuration or
change of workflow for school administration or teachers.

Furthermore, as the Google Sheets data is loaded and cached client-side, the IT department will not have to create any
complex deployment environments. Simply build the application with `npm run build`, changing the package.json `homepage`
attribute as necessary, and place the static files on any web server or free static deployment service such as [Netlify](https://netlify.com).


## Deployment

Quick deploy with Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://gitlab.com/rubensoh/leonia-teacherwebsite-launcher)

*Note: Please go to all spreadsheets this application utilizes and press File > Publish to Web and then press the Publish button. This will
ensure optimal performance and make the application adhere to official Google API policies.*

1. Download the application source code
2. Edit the homepage attribute as necessary. See the [create-react-app Deployment section](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment)
for more information.
3. Inside of the folder containing `package.json`, run `npm run build`.
4. The `build/` folder should contain all of the necessary static files.
5. Deploy the static files to a platform or webserver of your choice.


## Configuration

TWL is configurable. Before building, you may edit the `config.json` file found in the `src/` folder to configure various spreadsheets to consolidate
information from, the website title, and the "Full Lists" texts underneath the search bar. The favicon may be edited simply by replacing `public/favicon.ico`
and rebuilding.

## Intellectual Property

The Leonia Teacher Website Launcher is licensed under the MIT License. See the LICENSE file for licensing details.