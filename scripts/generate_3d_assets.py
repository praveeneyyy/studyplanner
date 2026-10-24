import bpy
import math
import os

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_study_workspace_model(output_path):
    clear_scene()

    # 1. Base Open Book / Academic Plinth
    # Left Page
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.52, 0, 0))
    left_page = bpy.context.active_object
    left_page.name = "LeftPage"
    left_page.scale = (0.95, 1.3, 0.08)
    left_page.rotation_euler = (0, math.radians(-6), 0)

    # Right Page
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.52, 0, 0))
    right_page = bpy.context.active_object
    right_page.name = "RightPage"
    right_page.scale = (0.95, 1.3, 0.08)
    right_page.rotation_euler = (0, math.radians(6), 0)

    # Book Spine
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.05))
    spine = bpy.context.active_object
    spine.name = "Spine"
    spine.scale = (0.2, 1.35, 0.12)

    # 2. Floating Focus Crystal / Knowledge Orb
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.45, location=(0, 0, 0.9))
    orb = bpy.context.active_object
    orb.name = "KnowledgeOrb"

    # 3. Orbital Ring
    bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.035, location=(0, 0, 0.9))
    ring = bpy.context.active_object
    ring.name = "OrbitalRing"
    ring.rotation_euler = (math.radians(35), math.radians(20), 0)

    # Materials
    # Book Cover Material (Restrained Notion Olive)
    mat_cover = bpy.data.materials.new(name="Mat_Cover")
    mat_cover.use_nodes = True
    bsdf_cover = mat_cover.node_tree.nodes.get("Principled BSDF")
    if bsdf_cover:
        bsdf_cover.inputs["Base Color"].default_value = (0.176, 0.353, 0.153, 1.0) # #2D5A27
        bsdf_cover.inputs["Roughness"].default_value = 0.5
    spine.data.materials.append(mat_cover)

    # Book Pages Material (Warm Off-White Alabaster)
    mat_page = bpy.data.materials.new(name="Mat_Page")
    mat_page.use_nodes = True
    bsdf_page = mat_page.node_tree.nodes.get("Principled BSDF")
    if bsdf_page:
        bsdf_page.inputs["Base Color"].default_value = (0.96, 0.95, 0.93, 1.0) # Warm paper
        bsdf_page.inputs["Roughness"].default_value = 0.8
    left_page.data.materials.append(mat_page)
    right_page.data.materials.append(mat_page)

    # Crystal Material (Sage Glass / Ceramic)
    mat_orb = bpy.data.materials.new(name="Mat_Orb")
    mat_orb.use_nodes = True
    bsdf_orb = mat_orb.node_tree.nodes.get("Principled BSDF")
    if bsdf_orb:
        bsdf_orb.inputs["Base Color"].default_value = (0.357, 0.549, 0.318, 1.0) # #5B8C51
        bsdf_orb.inputs["Roughness"].default_value = 0.15
        bsdf_orb.inputs["Metallic"].default_value = 0.1
    orb.data.materials.append(mat_orb)

    # Ring Material (Polished Brass / Gold)
    mat_ring = bpy.data.materials.new(name="Mat_Ring")
    mat_ring.use_nodes = True
    bsdf_ring = mat_ring.node_tree.nodes.get("Principled BSDF")
    if bsdf_ring:
        bsdf_ring.inputs["Base Color"].default_value = (0.85, 0.65, 0.2, 1.0)
        bsdf_ring.inputs["Metallic"].default_value = 0.8
        bsdf_ring.inputs["Roughness"].default_value = 0.25
    ring.data.materials.append(mat_ring)

    # Export to GLB
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False
    )
    print(f"Exported study workspace model to: {output_path}")

def create_progress_gem_model(output_path):
    clear_scene()

    # Create Faceted Diamond / Reward Gem
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.7, radius2=0.0, depth=0.8, location=(0, 0, -0.4))
    lower_cone = bpy.context.active_object
    lower_cone.name = "LowerCone"

    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.7, radius2=0.45, depth=0.4, location=(0, 0, 0.2))
    upper_cone = bpy.context.active_object
    upper_cone.name = "UpperCone"

    # Join into single gem mesh
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    gem = bpy.context.active_object
    gem.name = "RewardGem"

    # Material
    mat_gem = bpy.data.materials.new(name="Mat_Gem")
    mat_gem.use_nodes = True
    bsdf = mat_gem.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.12, 0.72, 0.35, 1.0) # Emerald
        bsdf.inputs["Roughness"].default_value = 0.1
        bsdf.inputs["Metallic"].default_value = 0.3
    gem.data.materials.append(mat_gem)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False
    )
    print(f"Exported progress gem model to: {output_path}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "models"))
    workspace_glb = os.path.join(base_dir, "study_workspace.glb")
    gem_glb = os.path.join(base_dir, "progress_gem.glb")

    create_study_workspace_model(workspace_glb)
    create_progress_gem_model(gem_glb)
    print("All Blender 3D models generated successfully!")
