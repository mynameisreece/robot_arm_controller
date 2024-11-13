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

# Define the helper function for executing commands
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
    elif command == 'globe_pose':
        bot.arm.set_ee_cartesian_trajectory(z=0.04)
        bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    elif command == 'ready_pose':
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

def ready_position(bot):
    bot.gripper.release()
    bot.arm.set_ee_cartesian_trajectory(z=0.04)
    bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    bot.gripper.grasp()
    time.sleep(1)

def grab_hemi(bot,latRad,lonRad):
    bot.arm.go_to_home_pose()
    bot.arm.set_ee_cartesian_trajectory(x=-0.3,z=-0.05)
    bot.arm.set_single_joint_position(joint_name='wrist_rotate', position=lonRad)
    bot.arm.set_ee_cartesian_trajectory(pitch=latRad)

def drop_hemi(bot,latRad,lonRad):
    bot.arm.go_to_home_pose()
    bot.arm.set_ee_cartesian_trajectory(z=0.04)
    bot.arm.set_single_joint_position(joint_name='wrist_angle', position=np.pi/2)
    bot.gripper.release()
    time.sleep(1)
    bot.arm.set_ee_cartesian_trajectory(z=0.1)
    bot.arm.go_to_home_pose()
    bot.gripper.grasp()


def go_to_coords(bot):
    loc = input("Please enter an address or location:")
    lat, lon = get_locCoords(loc)
    if lat is not None and lon is not None:
        print(f"The coordinates of '{loc}' are: Latitude: {lat}, Longitude {lon}.")
    else:
        print("Could not find the coordinates for the given location.")

    latRad = np.radians(lat)
    lonRad = np.radians(lon)
    grab_hemi(bot,latRad,lonRad)
    input("Press Enter to put the globe to home...")
    #drop_hemi(bot,latRad,lonRad)
    bot.arm.go_to_home_pose()
    

def go_to_location(location_name):
    lat, lon = get_locCoords(location_name)
    print(lat, lon)
    if lat is not None and lon is not None:
        print(f"The coordinates of '{location_name}' are: Latitude: {lat}, Longitude {lon}.")
    else:
        print("Could not find the coordinates for the given location.")

    latRad = np.radians(lat)
    lonRad = np.radians(lon)
    print (latRad, lonRad)
    #bot.arm.go_to_home_pose()
    #bot.arm.set_ee_cartesian_trajectory(x=-0.3,z=-0.05)
    bot.arm.set_single_joint_position(joint_name='wrist_rotate', position=lonRad)
    #bot.arm.set_ee_cartesian_trajectory(pitch=latRad)


# Define the route for receiving commands
@app.route('/command', methods=['POST'])
def command():
    data = request.json
    #print(data)
    #command = data.get('command')  # Get command from the request body
    #location_name = data.get('location')
    #print(command, location_name)
    return execute_command(data)


# Initialize the robot
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
