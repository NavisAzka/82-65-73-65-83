import os

from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import SetEnvironmentVariable

from ament_index_python.packages import get_package_share_directory

path_config_buffer = os.getenv('AMENT_PREFIX_PATH', '')
path_config_buffer_split = path_config_buffer.split(":")
ws_path = path_config_buffer_split[0] + "/../../"
path_config = ws_path + "src/ros2_utils/configs/"

def generate_launch_description():
    
    SetEnvironmentVariable(name='RMW_IMPLEMENTATION', value='rmw_cyclonedds_cpp'),
    SetEnvironmentVariable(name='CYCLONEDDS_URI', value='file://' + path_config + 'cyclonedds.xml'),

    rosbridge_server = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket',
        output='screen',
        respawn=True,
    )
    rosapi_node = Node(
        package='rosapi',
        executable='rosapi_node',
        name='rosapi_node',
        output='screen',
        respawn=True,
    )

    io_reeman = Node(
        package='communication',
        executable='io_reeman',
        name='io_reeman',
        parameters=[
            {
                "max_vx": 0.3,
                "max_vth": 0.3,
                "reeman_controller_ip": "10.42.0.166",
                "configs_path": path_config,
                "target_point_1_x": 2.0,
                "target_point_1_y": 0.0,
                "target_point_1_yaw": 0.0,

                "target_point_2_x": 0.0,
                "target_point_2_y": 2.0,
                "target_point_2_yaw": 1.57,
            },
        ],
        output='screen',
        respawn=True,
    )

    ds4_driver = Node(
        package='ds4_driver',
        executable='ds4_driver_node.py',
        name='ds4_driver',
        output='screen',
        respawn=True,
        remappings=[
            ('/status', '/ds4/status')]
    )

    wifi_control = Node(
        package="communication",
        executable="wifi_control",
        name="wifi_control",
        parameters=[
            {
                "hotspot_ssid": "gh_template",
                "hotspot_password": "gh_template",
            },
        ],
        output="screen",
        respawn=True,
    )

    web_video_server = Node(
        package='web_video_server',
        executable='web_video_server',
        name='web_video_server',
        output='screen',
        respawn=True,
    )

    ui_server = Node(
        package="web_ui",
        executable="ui_server.py",
        name="ui_server",
        parameters=[
            {
                "ui_root_path": os.path.join(ws_path,"src/web_ui/src")
            },
        ],
        output="screen",
        respawn=True,
    )

    master = Node(
        package='master',
        executable='master',
        name='master',
        output='screen',
        respawn=True,
        prefix='nice -n -10',
    )

    telemetry = Node(
        package="communication",
        executable="telemetry.py",
        name="telemetry",
        parameters=[{
            "INFLUXDB_URL": "http://172.30.37.21:8086",
            "INFLUXDB_USERNAME": "awm462",
            "INFLUXDB_PASSWORD": "wildan462",
            "INFLUXDB_ORG": "awmawm",
            "INFLUXDB_BUCKET": "ujiCoba",
            "ROBOT_NAME": "gh_template",
        }],
        output="screen",
        respawn=True,
    )

    keyboard_input = Node(
        package='hardware',
        executable='keyboard_input',
        name='keyboard_input',
        output='screen',
        prefix=['gnome-terminal --'],
    )

    audio_controller = Node(
        package='hardware',
        executable='audio_controller.py',
        name='audio_controller',
        output='screen',
        respawn=True,
    )

    capture = Node(
        package='vision',
        executable='capture',
        name='capture',
        output='screen',
        respawn=True,
        parameters=[
            {"camera_path": "/dev/v4l/by-id/usb-046d_C922_Pro_Stream_Webcam_3BD7DCCF-video-index0"},
        ],  
    )

    detection = Node(
        package='vision',
        executable='detection.py',
        name='detection',
        output='screen',
        respawn=True,
    )

    hand_track = Node(
        package='vision',
        executable='hand_track.py',
        name='hand_track',
        output='screen',
        respawn=True,
    )

    face_detection = Node(
        package='vision',
        executable='face_detection.py',
        name='face_detection',
        output='screen',
        respawn=True,
    )


    return LaunchDescription(
        [
            rosapi_node,
            web_video_server,
            ui_server,
            rosbridge_server,

            audio_controller,
            
            capture,
            hand_track,
            face_detection,

            # telemetry,

            # master,

            # keyboard_input,

            # wifi_control,
            io_reeman,
            ds4_driver,
        ]
    )
