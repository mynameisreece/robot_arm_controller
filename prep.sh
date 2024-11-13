#!/bin/bash
gnome-terminal -- bash -c "source ~/interbotix_ws/install/setup.bash; exit"
gnome-terminal -- bash -c "ros2 launch interbotix_xsarm_control xsarm_control.launch.py robot_model:=wx250s; exit"
gnome-terminal -- bash -c "python3 app.py; exit"
