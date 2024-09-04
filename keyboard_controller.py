#!/usr/bin/env python3

import sys
import time

from interbotix_xs_modules.xs_robot.arm import InterbotixManipulatorXS
import numpy as np

"""
To get started, open a terminal and type:

    ros2 launch interbotix_xsarm_control xsarm_control.launch.py robot_model:=wx250s

"""

def d_move(bot,dKey):
    #todo - update code to use match cases after updating to python3.10+
    if dKey == 'w':
        bot.arm.set_ee_cartesian_trajectory(z=0.1)
    elif dKey.lower() == 's':
        bot.arm.set_ee_cartesian_trajectory(z=-0.1)
    elif dKey == 'a':
        bot.arm.set_ee_cartesian_trajectory(y=0.1)
    elif dKey.lower() == 'd':
        bot.arm.set_ee_cartesian_trajectory(y=-0.1)
    elif dKey == 'j':
        go_to_coords(bot)
    elif dKey == 'r':
        print(bot.arm.get_ee_pose())
    elif dKey == 'h':
        bot.arm.go_to_home_pose()
    elif dKey == 'q':
        bot.gripper.release()
    elif dKey == 'e':
        bot.gripper.grasp()
    elif dKey == 'l':
        bot.arm.go_to_sleep_pose()
    elif dKey == 'n':
        return False

def main():
    bot = InterbotixManipulatorXS(
        robot_model='wx250s',
        group_name='arm',
        gripper_name='gripper'
    )

    if (bot.arm.group_info.num_joints < 5):
        bot.core.get_logger().fatal('This demo requires the robot to have at least 5 joints!')
        bot.shutdown()
        sys.exit()

    bot.arm.go_to_home_pose()

    while True:
        dKey = input("Enter option:").lower()
        if dKey == 'n':
            break
        d_move(bot,dKey)
    
    bot.arm.go_to_home_pose()
    bot.arm.go_to_sleep_pose()

    bot.shutdown()

if __name__ == '__main__':
    main()