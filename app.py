from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import subprocess
from interbotix_xs_modules.xs_robot.arm import InterbotixManipulatorXS
import time
from geopy.geocoders import Nominatim
import numpy as np

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from React

# The function for executing commands
# Todo - change from if/elif to match/case logic (Current robot library on supports Python 3.8 while match/case is Python 3.10)
def execute_command(data):
    command = data.get('command')
    location_name = data.get('location')
    if command == 'move_up':
        bot.arm.set_ee_cartesian_trajectory(z=0.1)
    elif command == 'move_down':
        bot.arm.set_ee_cartesian_trajectory(z=-0.1)
    elif command == 'move_left':
        bot.arm.set_ee_cartesian_trajectory(y=0.1)
    elif command == 'move_right':
        bot.arm.set_ee_cartesian_trajectory(y=-0.1)
    elif command == 'go_to_coords':
        bot.arm.set_ee_cartesian_trajectory(x=0.2, y=0.2, z=0.2)
    elif command == 'print_pose':
        return jsonify(message=str(bot.arm.get_ee_pose())), 200
    elif command == 'home_pose':
        bot.arm.go_to_home_pose()
    elif command == 'globe_pose': # Sets robot in pose to grab globe
        bot.arm.set_ee_cartesian_trajectory(z=0.04)
        bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    elif command == 'ready_pose': # Moves robot backwards to be ready to move the globe
        bot.arm.set_ee_cartesian_trajectory(x=-0.1)
    elif command == 'release_gripper':
        bot.gripper.release()
    elif command == 'grasp_gripper':
        bot.gripper.grasp()
    elif command == 'sleep_pose':
        bot.arm.go_to_sleep_pose()
    elif command == 'show_location':
        go_to_location(location_name)
    elif command == 'shutdown':
        bot.arm.go_to_home_pose()
        bot.arm.go_to_sleep_pose()
        bot.shutdown()
        return jsonify(message="Robot shutdown"), 200
    else:
        return jsonify(message="Invalid command"), 400
    return jsonify(message="Command executed successfully"), 200

# Gets the latitude and longitude coordinates using the location provided by the user
def get_locCoords(loc):
    geolocator = Nominatim(user_agent="geo_locator")
    try:
        location = geolocator.geocode(loc)
        if location:
            return location.latitude, location.longitude 
        else:
            return None, None
    except Exception as e:
        print("An error occureed:", e)
        return None,None

# Not used - a movement set for grabbing the globe
def ready_position(bot):
    bot.gripper.release()
    bot.arm.set_ee_cartesian_trajectory(z=0.04)
    bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    bot.gripper.grasp()
    time.sleep(1)

# Not used - a movement set for pistioning the globe based on the coordinates retrieved
def grab_hemi(bot,latRad,lonRad):
    bot.arm.go_to_home_pose()
    bot.arm.set_ee_cartesian_trajectory(x=-0.3,z=-0.05)
    bot.arm.set_single_joint_position(joint_name='wrist_rotate', position=lonRad)
    bot.arm.set_ee_cartesian_trajectory(pitch=latRad)

# Not used - a movement set for returning the globe back to rest and moving the robot back to home
def drop_hemi(bot,latRad,lonRad):
    bot.arm.go_to_home_pose()
    bot.arm.set_ee_cartesian_trajectory(z=0.04)
    bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    bot.gripper.release()
    time.sleep(1)
    bot.arm.set_ee_cartesian_trajectory(z=0.1)
    bot.arm.go_to_home_pose()
    bot.gripper.grasp()

# Gets the lat/lon coordinates and moves tbe robot based on these coords so that the location on the globe is shown front and center
def go_to_location(location_name):
    lat, lon = get_locCoords(location_name)
    if lat is not None and lon is not None:
        print(f"The coordinates of '{location_name}' are: Latitude: {lat}, Longitude {lon}.")
    else:
        print("Could not find the coordinates for the given location.")
    latRad = np.radians(lat)
    lonRad = np.radians(lon)
    bot.arm.go_to_home_pose()
    bot.arm.set_ee_cartesian_trajectory(x=-0.3,z=-0.05)
    bot.arm.set_single_joint_position(joint_name='wrist_rotate', position=lonRad)
    bot.arm.set_ee_cartesian_trajectory(pitch=latRad)
    return jsonify(message="Command executed successfully"), 200


# The route for receiving commands
@app.route('/command', methods=['POST'])
def command():
    data = request.json
    return execute_command(data)


# Initializes the robot
bot = InterbotixManipulatorXS(
    robot_model='wx250s',
    group_name='arm',
    gripper_name='gripper'
)

# Ensure robot has sufficient joints
if bot.arm.group_info.num_joints < 5:
    bot.core.get_logger().fatal('This demo requires the robot to have at least 5 joints!')
    bot.shutdown()
    sys.exit()

if __name__ == '__main__':
    bot.arm.go_to_home_pose()  # Initialize to home pose when the app starts
    app.run(debug=True)
