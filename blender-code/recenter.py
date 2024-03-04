import bpy

def set_origin_to_geometry(objects):
    for obj in objects:
        bpy.context.view_layer.objects.active = obj  # Set active object
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')  # Set origin to geometry

def find_lowest_object_and_z(objects):
    lowest_z = None
    lowest_obj = None
    for obj in objects:
        # Update the scene to ensure all transformations are current
        bpy.context.view_layer.update()
        # Calculate the global Z position of the object's lowest vertex
        global_vertices = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
        obj_lowest_z = min(v.z for v in global_vertices)
        if lowest_z is None or obj_lowest_z < lowest_z:
            lowest_z = obj_lowest_z
            lowest_obj = obj
    return lowest_obj, lowest_z

def align_objects_to_lowest(objects, lowest_obj, lowest_z):
    # Calculate the difference needed to move the lowest object to (0,0,0)
    z_diff = -lowest_z
    # Calculate the translation needed for the lowest object to align its bottom at (0,0,0)
    translation_vector = -lowest_obj.matrix_world.translation
    translation_vector.z += z_diff  # Adjust only for Z-axis

    # Move the lowest object first
    lowest_obj.location += translation_vector

    # Move all other objects by the same translation vector to keep relative positions
    for obj in objects:
        if obj != lowest_obj:
            obj.location += translation_vector


def set_origins_to_world_origin(objects):
    for obj in objects:
        # Store the current location of the object
        current_location = obj.location.copy()

        # Move the object temporarily so its origin is at the world origin
        bpy.context.view_layer.objects.active = obj
        obj.location = (0, 0, 0)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

        # Restore the object's original location
        obj.location = current_location


# Main
selected_objects = [obj for obj in bpy.context.selected_objects if obj.type == 'MESH']

# 1. Set origin to geometry for each selected object
set_origin_to_geometry(selected_objects)

# 2. Find the object with the lowest-Z value and from which object it comes
lowest_obj, lowest_z = find_lowest_object_and_z(selected_objects)

# 3. Align this object to (0,0,0) on the Z-axis and move the rest accordingly
align_objects_to_lowest(selected_objects, lowest_obj, lowest_z)

#4. Reset the origin of all objects to (0,0,0)
set_origins_to_world_origin(selected_objects)