# Wardrobe sprites

Created with the built-in imagegen tool using existing project wardrobe photos as edit targets. Original photos are preserved. Outputs are single transparent 2 × 2 sprite atlases consumed by CSS.

`wardrobe-atlas.png`: navy shirt / beige chinos / white sneaker / maroon top, in reading order.

`wardrobe-atlas-2.png`: white linen shirt / olive kurta / tan loafers / leather watch, in reading order.

Prompt specification for each atlas: extract only the four named garments from their corresponding asset photos; place them centered in four equal square cells, in reading order, with transparent padding; preserve original colors, materials and proportions; remove backgrounds, surfaces, props, and ground shadows; keep actual alpha transparency and avoid visible grid lines, checkerboard backgrounds, and cross-cell overlap. The second prompt additionally requests crisp edges without colored fringes or background remnants.

Source assets: `assets/navy_shirt.jpg`, `beige_chinos.jpg`, `white_sneakers.jpg`, `maroon_top.jpg`, `white_linen_shirt.jpg`, `olive_kurta.jpg`, `tan_loafers.jpg`, `leather_watch.jpg`.
