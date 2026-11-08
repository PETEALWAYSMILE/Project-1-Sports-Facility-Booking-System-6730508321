/**
 * @swagger
 * {
 *   "/api/v1/facilities": {
 *     "get": {
 *       "tags": [
 *         "Facilities"
 *       ],
 *       "summary": "List active facilities",
 *       "description": "Public list sorted by name. No search, filtering, or pagination parameters are implemented.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean",
 *                     "example": true
 *                   },
 *                   "count": {
 *                     "type": "integer"
 *                   },
 *                   "data": {
 *                     "type": "array",
 *                     "items": {
 *                       "$ref": "#/components/schemas/Facility"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     },
 *     "post": {
 *       "tags": [
 *         "Facilities"
 *       ],
 *       "summary": "Create a facility",
 *       "description": "Admin only. Facility names must be unique.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "201": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean",
 *                     "example": true
 *                   },
 *                   "data": {
 *                     "$ref": "#/components/schemas/Facility"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       },
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/FacilityInput"
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "/api/v1/facilities/{id}": {
 *     "get": {
 *       "tags": [
 *         "Facilities"
 *       ],
 *       "summary": "Get a facility",
 *       "description": "Public access to one active facility.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean",
 *                     "example": true
 *                   },
 *                   "data": {
 *                     "$ref": "#/components/schemas/Facility"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       },
 *       "parameters": [
 *         {
 *           "$ref": "#/components/parameters/ResourceId"
 *         }
 *       ]
 *     },
 *     "put": {
 *       "tags": [
 *         "Facilities"
 *       ],
 *       "summary": "Update a facility",
 *       "description": "Admin only. Updates supplied fields on an active facility.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean",
 *                     "example": true
 *                   },
 *                   "data": {
 *                     "$ref": "#/components/schemas/Facility"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       },
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/FacilityUpdate"
 *             }
 *           }
 *         }
 *       },
 *       "parameters": [
 *         {
 *           "$ref": "#/components/parameters/ResourceId"
 *         }
 *       ]
 *     },
 *     "delete": {
 *       "tags": [
 *         "Facilities"
 *       ],
 *       "summary": "Delete a facility",
 *       "description": "Admin only. Soft-deletes by setting isActive to false; existing bookings are not deleted.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/EmptyResponse"
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       },
 *       "parameters": [
 *         {
 *           "$ref": "#/components/parameters/ResourceId"
 *         }
 *       ]
 *     }
 *   }
 * }
 */
const express = require("express");
const {
  getFacilities,
  getFacility,
  getFacilityAvailability,
  createFacility,
  updateFacility,
  deleteFacility,
} = require("../controllers/facilities");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
router.route("/").get(getFacilities).post(protect, authorize("admin"), createFacility);
router.route("/:id/availability").get(getFacilityAvailability);
router.route("/:id").get(getFacility).put(protect, authorize("admin"), updateFacility).delete(protect, authorize("admin"), deleteFacility);

module.exports = router;
