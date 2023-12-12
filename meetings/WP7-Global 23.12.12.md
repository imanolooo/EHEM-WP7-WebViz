**Data**: [[21-11-2023]]
**Tema**: Reunió regular: 
**Assistents**: Federico, Giulia, Marius, Imanol

---
**tags**: #meeting/ehem #meeting/ehem_virvig
**links**: 
--- -


# Notes
- We will work in interface with react
- Marius has started to work in changing models
- Shown the discussion with begonya
- discussed next steps
- start putting this in the deliverables


# STEPS: UPLOAD TO GITHUB

- Navigation inside the models -> indoors and cesium is thougt for outdoors => CYENS
	- first-person navigation improved => DONE
		- rotation, pan and zoom
	- teleport-to targets => DONE
		- with a defined point in code.
		- Extend it to be stored in a JSON file.
	- MAP: navigation architectural map
		- teleport to architectural spaces
			- Needs to define a file with descriptions
		- history of the visited places -> help the user during the navigation
	- STORY: navigation art historian landmark map => ordered set of landmarks
		- we can use the cesium ones => STORY MODE
		- teleport to pov
		- history of the visited places -> help the user during the navigation
	- CHANGE MODELS: navigation intramodel
		- changing the displayed model => WiP
			- DONE change the model with a button
			- TBD connect with GUI
	- GUI: Needs a button to switch between orbital and first-person navigation
- Define volume (architectural phases) and keypoint (poi/landmarks)
	- Better, define points inside the volume to know where the user is.
- Create all the needed menus
- Connection to DB -> XML file (obtained from filemaker)
	- read and parse the XML file => DONE
	- showing the graphic materials => WiP
		- all the available => WiP
		- all the related to an specific architectural space
			- JS need to detect in which architectural space is the user at anytime
		- Alternative to the carrusel => use OpenSeaDragon for large images.
	- showing the descriptions
		- monument level
		* architectural phase level
		* architectural space level
	* showing the annotation => UPC

- Evripidis creates the README on how to install and execute the code (React + NPM)

* Decide license! => MIT

* How we will manage the front-end+style? -> React!


## Things to Do:
- [ ] 
- [ ] 