import Konva from "konva";
import { actions, createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIx8ALEQBMilQFYVAZnXqAbAHYTigByKANCExK9RoiotHXLk3z7qAnNqMAvgG2aFh4hEQQAE4AhgDuBFDU9My0AGpM-EJIIGhiktKyCggqRj5EFiZu2iY+Jup8iuq6tvYIWooVnio+ZQa6RoHBuRg4BMTR8YkUAEIxAMYA1rDIC2BZsnkSUjI5xaXqRI4+jYrKZToWeq2IALRaRL0W-galPXp8eipBIaPhE7EEvgkkx8OIwFENjktgVdqBinwbgg+D8RmFxpFAdNaIxWBxuFCRPkdkUlGUiPVtF9vD4LH4LFckbcrBoeuoTFSVHxdOo9CZUaExhFJkCQbB5jFkOtBJtRNtCntEMY1HxKsYfD5eV91BYkZZyioObz6l8rtpuUFhvhUBA4LL0YRZcSFfC7mc9BpzaZ2XVml51EzFG4KWyOccGTV+cNBf8SGQwE75XD5HcjNpPXxvbVKf6kZUiKpVUYVJoLHw-LSBX8MSLEonYaSEOy+BSTK40-19CoVHmTAWue5S+XtJXLUA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["createLine"]
                    }
                }
            },

            drawing: {
                on: {
                    MOUSEMOVE: {
                        target: "drawing",
                        actions: ["setLastPoint"],
                        internal: true
                    },

                    Backspace: {
                        target: "drawing",
                        actions: ["removeLastPoint"],
                        internal: true
                    },

                    Enter: {
                        target: "idle",
                        actions: ["saveLine"],
                        cond: "plusDeDeuxPoints"
                    },

                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["addPoint"],
                        internal: true,
                        cond: "pasPlein"
                    }, 
                    Escape: {
                        target: "idle",
                        actions: ["abandon"]
                    }
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                // Supprimer la variable polyline :
                polyline.remove(layer.batchDraw());
                
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                if(size>4){
                const provisoire = currentPoints.slice(0, size-2); // Le point provisoire
                //const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(provisoire); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
                }
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                // Retourner vrai si la polyline a moins de 10 points
                return polyline.points().length <= (MAX_POINTS*2);
                // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
